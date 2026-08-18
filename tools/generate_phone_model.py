"""Generate the original Blabb Android showcase model.

Run from the repository root:
    blender --background --python tools/generate_phone_model.py

The model is intentionally generic rather than a copy of a commercial handset.
It has one continuous enclosure with flush front glass and exterior details;
there are deliberately no interior component meshes or exploded layers.
"""

from math import pi
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
body = rounded_box("PHONE_BODY", (3.62, 0.54, 7.38), (0, 0, 0), plum_matte, 0.27)
body["assembly_layer"] = "frame"
body["surface"] = "continuous-shell"

# A nearly flush rear finish adds depth without becoming another phone layer.
back_accent = rounded_box("BACK_ACCENT", (3.22, 0.03, 6.75), (0, 0.283, -0.08), plum, 0.2)
back_accent["assembly_layer"] = "back"

# The camera bar is the only deliberate rear protrusion.
camera_bar = rounded_box("CAMERA_BAR", (3.18, 0.16, 0.68), (0, 0.35, 2.74), graphite, 0.14)
camera_bar["assembly_layer"] = "back"
for index, x in enumerate((-0.92, -0.38)):
    torus(f"CAMERA_RING_{index + 1}", 0.205 if index == 0 else 0.17, 0.04, (x, 0.445, 2.74), steel)
    cylinder(f"CAMERA_LENS_{index + 1}", 0.164 if index == 0 else 0.132, 0.055, (x, 0.47, 2.74), black)
    cylinder(f"CAMERA_GLINT_{index + 1}", 0.043, 0.06, (x - 0.04, 0.505, 2.79), aqua, vertices=32)
cylinder("CAMERA_FLASH", 0.092, 0.055, (0.86, 0.455, 2.74), paper, vertices=40)
rounded_box("CAMERA_CORAL_ACCENT", (0.24, 0.04, 0.065), (1.22, 0.45, 2.74), coral, 0.025)

# A single thin glass surface sits flush inside the plum lip. The animated app
# UI is rendered just above it by the website, so no OLED or display-bed slabs
# are needed in the asset.
glass = rounded_box("DISPLAY_GLASS", (3.45, 0.04, 7.16), (0, -0.292, 0), black, 0.235)
glass["assembly_layer"] = "glass"

# Punch-hole camera, earpiece and tactile edge details.
cylinder("SELFIE_RING", 0.09, 0.022, (0, -0.324, 3.17), steel, vertices=48)
cylinder("SELFIE_LENS", 0.061, 0.028, (0, -0.34, 3.17), black, vertices=48)
rounded_box("EARPIECE", (0.66, 0.022, 0.048), (0, -0.325, 3.47), graphite, 0.018)

rounded_box("VOLUME_BUTTON", (0.09, 0.3, 0.8), (1.84, 0, 1.4), plum, 0.04)
rounded_box("POWER_BUTTON", (0.105, 0.3, 0.52), (1.85, 0, 0.52), aqua, 0.045)
for index, x in enumerate((-1.18, -0.94, -0.7, -0.46, 0.46, 0.7, 0.94, 1.18)):
    cylinder(f"SPEAKER_HOLE_{index}", 0.032, 0.055, (x, 0, -3.71), black, rotation=(0, 0, 0), vertices=24)
rounded_box("USB_C_PORT", (0.64, 0.18, 0.075), (0, 0, -3.71), black, 0.04)
cylinder("MIC_HOLE", 0.032, 0.06, (1.43, 0, -3.71), black, rotation=(0, 0, 0), vertices=24)

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
