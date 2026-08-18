"""Generate the original Blabb Android showcase model.

Run from the repository root:
    blender --background --python tools/generate_phone_model.py

The model is intentionally generic rather than a copy of a commercial handset.
It has one continuous enclosure with flush front glass and exterior details;
there are deliberately no interior component meshes or exploded layers.
"""

from math import cos, pi, sin
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "phone" / "blabb-phone.glb"


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def material(name, color, metallic=0.0, roughness=0.4, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in shader.inputs:
        shader.inputs["Coat Weight"].default_value = 0.45 if metallic > 0.5 else 0.2
        shader.inputs["Coat Roughness"].default_value = min(0.28, roughness)
    if emission:
        shader.inputs["Emission Color"].default_value = (*emission, 1.0)
        shader.inputs["Emission Strength"].default_value = emission_strength
    return mat


def finish_mesh(obj, bevel=0.06, segments=4):
    bpy.context.view_layer.objects.active = obj
    if bevel > 0:
        modifier = obj.modifiers.new("precision bevel", "BEVEL")
        modifier.width = bevel
        modifier.segments = segments
        modifier.limit_method = "ANGLE"
        modifier.harden_normals = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def rounded_box(name, size, location, mat, bevel=0.06, parent=None):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish_mesh(obj, min(bevel, min(size) * 0.45), 5)
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj


def rounded_plate(name, width, depth, height, radius, location, mat, parent=None, corner_segments=10):
    """Create a shallow rounded rectangle without thickness limiting its corner radius."""
    half_width = width / 2
    half_height = height / 2
    perimeter = []
    corners = (
        (half_width - radius, half_height - radius, 0),
        (-half_width + radius, half_height - radius, 90),
        (-half_width + radius, -half_height + radius, 180),
        (half_width - radius, -half_height + radius, 270),
    )
    for center_x, center_z, start_angle in corners:
        for step in range(corner_segments + 1):
            angle = (start_angle + step * 90 / corner_segments) * pi / 180
            perimeter.append((center_x + cos(angle) * radius, center_z + sin(angle) * radius))

    curve_data = bpy.data.curves.new(f"{name}_CURVE", "CURVE")
    curve_data.dimensions = "2D"
    curve_data.resolution_u = 1
    curve_data.fill_mode = "BOTH"
    curve_data.extrude = depth / 2
    spline = curve_data.splines.new("POLY")
    spline.points.add(len(perimeter) - 1)
    for point, (x, z) in zip(spline.points, perimeter):
        point.co = (x, z, 0, 1)
    spline.use_cyclic_u = True

    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler.x = pi / 2
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj


def boolean_recess(target, cutter):
    """Cut a real opening and remove the temporary cutter from the export."""
    modifier = target.modifiers.new(f"recess-{cutter.name.lower()}", "BOOLEAN")
    modifier.operation = "DIFFERENCE"
    modifier.solver = "EXACT"
    modifier.object = cutter
    bpy.context.view_layer.objects.active = target
    target.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def cylinder(name, radius, depth, location, mat, rotation=(pi / 2, 0, 0), vertices=64, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    finish_mesh(obj, min(0.018, depth * 0.18), 3)
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj


def torus(name, major_radius, minor_radius, location, mat, rotation=(pi / 2, 0, 0), parent=None):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=64,
        minor_segments=12,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj


clear_scene()

# Blabb palette translated into a cinematic product-material set.
plum = material("BLABB_PLUM", (0.055, 0.018, 0.071), metallic=0.58, roughness=0.22)
plum_matte = material("BLABB_PLUM_MATTE", (0.085, 0.035, 0.105), metallic=0.16, roughness=0.48)
graphite = material("GRAPHITE", (0.018, 0.015, 0.022), metallic=0.82, roughness=0.2)
black = material("BLACK_GLASS", (0.004, 0.004, 0.007), metallic=0.28, roughness=0.08)
steel = material("POLISHED_STEEL", (0.29, 0.25, 0.31), metallic=0.96, roughness=0.13)
aqua = material("BLABB_AQUA", (0.25, 0.75, 0.72), metallic=0.12, roughness=0.28, emission=(0.24, 0.78, 0.75), emission_strength=0.5)
coral = material("BLABB_CORAL", (0.85, 0.27, 0.12), metallic=0.16, roughness=0.3, emission=(0.9, 0.22, 0.08), emission_strength=0.22)
paper = material("PAPER", (0.94, 0.89, 0.96), metallic=0.0, roughness=0.32)

# Blender uses X/Z for the phone face and Y for depth. glTF's Y-up conversion
# makes these align to the website's X/Y face and Z depth. PHONE_BODY is the
# complete structural shell: its rounded corners continue uninterrupted from
# the back to the front bezel, so a side view never reveals a component stack.
body = rounded_box("PHONE_BODY", (3.5, 0.42, 7.45), (0, 0, 0), plum_matte, 0.19)
body["assembly_layer"] = "frame"
body["surface"] = "continuous-shell"

# A nearly flush rear finish adds depth without becoming another phone layer.
back_accent = rounded_plate("BACK_ACCENT", 3.18, 0.018, 6.86, 0.22, (0, 0.219, -0.06), plum)
back_accent["assembly_layer"] = "back"

# The camera bar is the only deliberate rear protrusion.
camera_bar = rounded_plate("CAMERA_BAR", 3.02, 0.105, 0.61, 0.15, (0, 0.262, 2.82), graphite)
camera_bar["assembly_layer"] = "back"
for index, x in enumerate((-0.92, -0.38)):
    lens_radius = 0.188 if index == 0 else 0.157
    torus(f"CAMERA_RING_{index + 1}", lens_radius, 0.028, (x, 0.332, 2.82), steel)
    torus(f"CAMERA_INNER_RING_{index + 1}", lens_radius - 0.038, 0.012, (x, 0.351, 2.82), graphite)
    cylinder(f"CAMERA_LENS_{index + 1}", lens_radius - 0.052, 0.028, (x, 0.36, 2.82), black)
    cylinder(f"CAMERA_GLINT_{index + 1}", 0.036, 0.016, (x - 0.038, 0.382, 2.865), aqua, vertices=32)
cylinder("CAMERA_FLASH", 0.082, 0.025, (0.84, 0.345, 2.82), paper, vertices=40)
rounded_box("CAMERA_CORAL_ACCENT", (0.22, 0.022, 0.055), (1.19, 0.329, 2.82), coral, 0.02)

# A single thin glass surface overlaps into the solid plum face, leaving no
# cavity that can become visible edge-on. Only 0.006 model units sit above the
# metal rail; the rest is embedded in the continuous enclosure. The animated
# app UI is rendered directly on this outer surface by the website.
glass = rounded_plate("DISPLAY_GLASS", 3.42, 0.024, 7.35, 0.23, (0, -0.204, 0), black)
glass["assembly_layer"] = "glass"

# Punch-hole camera, earpiece and tactile edge details.
cylinder("SELFIE_RING", 0.084, 0.014, (0, -0.224, 3.39), steel, vertices=48)
cylinder("SELFIE_LENS", 0.057, 0.018, (0, -0.234, 3.39), black, vertices=48)
rounded_box("EARPIECE", (0.58, 0.014, 0.038), (0, -0.222, 3.57), graphite, 0.014)

# Slim, frame-matched controls read as precision hardware rather than branded
# badges. Their polished plum finish separates them from the matte rail only
# when light catches the shallow projection.
rounded_box("VOLUME_BUTTON", (0.045, 0.16, 0.64), (1.765, 0, 1.38), plum, 0.02)
rounded_box("POWER_BUTTON", (0.045, 0.16, 0.38), (1.765, 0, 0.52), plum, 0.02)

# Bottom hardware is boolean-cut into the enclosure. Dark interior caps sit
# well behind the exterior surface, so the speaker, microphone, and USB-C port
# read as cavities rather than decorative pieces glued onto the phone.
for index, x in enumerate((0.48, 0.64, 0.80, 0.96, 1.12, 1.28)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.034, depth=0.17, location=(x, 0, -3.71))
    cutter = bpy.context.object
    cutter.name = f"SPEAKER_CUTTER_{index}"
    boolean_recess(body, cutter)
    cylinder(f"SPEAKER_HOLE_{index}", 0.029, 0.008, (x, 0, -3.632), black, rotation=(0, 0, 0), vertices=24)

usb_cutter = rounded_box("USB_C_CUTTER", (0.64, 0.21, 0.2), (0, 0, -3.71), black, 0.07)
boolean_recess(body, usb_cutter)
rounded_box("USB_C_PORT", (0.53, 0.14, 0.018), (0, 0, -3.622), black, 0.04)
rounded_box("USB_C_TONGUE", (0.29, 0.052, 0.012), (0, 0.018, -3.64), graphite, 0.006)

bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=0.032, depth=0.17, location=(-1.16, 0, -3.71))
mic_cutter = bpy.context.object
mic_cutter.name = "MIC_CUTTER"
boolean_recess(body, mic_cutter)
cylinder("MIC_HOLE", 0.027, 0.008, (-1.16, 0, -3.632), black, rotation=(0, 0, 0), vertices=24)

# Hairline antenna breaks keep the rail believable without splitting the shell.
for side, x in (("LEFT", -1.754), ("RIGHT", 1.754)):
    for edge, z in (("TOP", 2.55), ("BOTTOM", -2.55)):
        rounded_box(f"ANTENNA_{side}_{edge}", (0.012, 0.24, 0.035), (x, 0, z), graphite, 0.006)

# Metadata used by the runtime and future asset audits.
for obj in bpy.context.scene.objects:
    if obj.type in {"MESH", "CURVE"}:
        obj["blabb_original_asset"] = True

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
for obj in mesh_objects:
    obj.data.calc_loop_triangles()
triangle_count = sum(len(obj.data.loop_triangles) for obj in mesh_objects)
bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT),
    export_format="GLB",
    export_apply=True,
    export_yup=True,
    export_materials="EXPORT",
    export_attributes=True,
    export_extras=True,
    export_cameras=False,
    export_lights=False,
)

print(f"Generated {OUTPUT} ({len(mesh_objects)} meshes, {triangle_count} triangles)")
