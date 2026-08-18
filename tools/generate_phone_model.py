"""Generate the original Blabb Android showcase model.

Run from the repository root:
    blender --background --python tools/generate_phone_model.py

The model is intentionally generic rather than a copy of a commercial handset.
Each major physical component remains a named mesh for maintainability, while
the website presents them as one cohesive, assembled product.
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


def trace(name, points, mat, thickness=0.012, parent=None):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 1
    curve.bevel_depth = thickness
    curve.bevel_resolution = 2
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for index, point in enumerate(points):
        spline.points[index].co = (*point, 1.0)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj


def label(name, text, location, size, mat, parent=None):
    bpy.ops.object.text_add(location=location, rotation=(pi / 2, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.data.body = text
    obj.data.align_x = "CENTER"
    obj.data.align_y = "CENTER"
    obj.data.size = size
    obj.data.extrude = 0.008
    obj.data.bevel_depth = 0.003
    obj.data.materials.append(mat)
    obj.parent = parent
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    return obj


clear_scene()

# Blabb palette translated into a cinematic product-material set.
plum = material("BLABB_PLUM", (0.055, 0.018, 0.071), metallic=0.58, roughness=0.22)
plum_matte = material("BLABB_PLUM_MATTE", (0.085, 0.035, 0.105), metallic=0.16, roughness=0.48)
graphite = material("GRAPHITE", (0.018, 0.015, 0.022), metallic=0.82, roughness=0.2)
black = material("BLACK_GLASS", (0.004, 0.004, 0.007), metallic=0.28, roughness=0.08)
steel = material("POLISHED_STEEL", (0.29, 0.25, 0.31), metallic=0.96, roughness=0.13)
silver = material("SOFT_SILVER", (0.62, 0.69, 0.7), metallic=0.88, roughness=0.2)
aqua = material("BLABB_AQUA", (0.25, 0.75, 0.72), metallic=0.12, roughness=0.28, emission=(0.24, 0.78, 0.75), emission_strength=0.5)
coral = material("BLABB_CORAL", (0.85, 0.27, 0.12), metallic=0.16, roughness=0.3, emission=(0.9, 0.22, 0.08), emission_strength=0.22)
copper = material("COPPER", (0.52, 0.16, 0.055), metallic=0.92, roughness=0.22)
gold = material("CONTACT_GOLD", (0.78, 0.49, 0.09), metallic=0.95, roughness=0.18)
board_mat = material("BOARD", (0.045, 0.12, 0.1), metallic=0.18, roughness=0.52)
battery_mat = material("BATTERY", (0.035, 0.038, 0.045), metallic=0.42, roughness=0.34)
paper = material("PAPER", (0.94, 0.89, 0.96), metallic=0.0, roughness=0.32)

# Physical stack. Blender uses X/Z for the phone face and Y for depth. glTF's
# Y-up conversion makes these align to the website's X/Y face and Z depth.
back = rounded_box("BACK_SHELL", (3.62, 0.16, 7.38), (0, 0.25, 0), plum_matte, 0.28)
back["assembly_layer"] = "back"

back_inlay = rounded_box("BACK_INLAY", (3.27, 0.055, 6.96), (0, 0.34, -0.1), plum, 0.23)
back_inlay["assembly_layer"] = "back"

camera_bar = rounded_box("CAMERA_BAR", (3.28, 0.28, 0.72), (0, 0.48, 2.74), graphite, 0.16)
camera_bar["assembly_layer"] = "back"
for index, x in enumerate((-0.92, -0.38)):
    torus(f"CAMERA_RING_{index + 1}", 0.205 if index == 0 else 0.17, 0.045, (x, 0.66, 2.74), steel)
    cylinder(f"CAMERA_LENS_{index + 1}", 0.164 if index == 0 else 0.132, 0.07, (x, 0.69, 2.74), black)
    cylinder(f"CAMERA_GLINT_{index + 1}", 0.045, 0.075, (x - 0.04, 0.735, 2.79), aqua, vertices=32)
cylinder("CAMERA_FLASH", 0.095, 0.065, (0.86, 0.66, 2.74), paper, vertices=40)

battery = rounded_box("BATTERY", (2.74, 0.18, 4.28), (0.18, 0.08, -0.46), battery_mat, 0.19)
battery["assembly_layer"] = "battery"
rounded_box("BATTERY_AQUA_SPINE", (0.09, 0.04, 3.55), (-0.98, -0.025, -0.46), aqua, 0.035)
label("BATTERY_LABEL", "PRIVATE POWER", (0.22, -0.025, -0.42), 0.19, silver)

board = rounded_box("MAINBOARD", (3.08, 0.14, 1.58), (0, -0.035, 2.29), board_mat, 0.15)
board["assembly_layer"] = "board"
board_lower = rounded_box("BOARD_SPINE", (0.72, 0.14, 2.7), (-1.07, -0.035, 0.33), board_mat, 0.12)
board_lower["assembly_layer"] = "board"

engine = rounded_box("LOCAL_ENGINE", (1.16, 0.16, 0.92), (0.23, -0.15, 2.25), graphite, 0.09)
engine["assembly_layer"] = "board"
rounded_box("LOCAL_ENGINE_CORE", (0.82, 0.045, 0.58), (0.23, -0.255, 2.25), plum, 0.065)
label("LOCAL_ENGINE_LABEL", "BLABB", (0.23, -0.29, 2.29), 0.18, aqua)
label("LOCAL_ENGINE_SUBLABEL", "LOCAL", (0.23, -0.29, 2.09), 0.085, paper)

for row in range(2):
    for col in range(8):
        x = -0.78 + col * 0.23
        z = 2.89 - row * 0.19
        rounded_box(f"ENGINE_CONTACT_{row}_{col}", (0.11, 0.045, 0.035), (x, -0.24, z), gold, 0.012)

for index in range(11):
    x = -1.25 + index * 0.25
    rounded_box(f"HEAT_FIN_{index}", (0.12, 0.09, 0.58), (x, -0.17, 1.53), silver if index % 2 else steel, 0.025)

for index, x in enumerate((-0.72, -0.23, 0.68, 1.08)):
    rounded_box(f"BOARD_CHIP_{index}", (0.34, 0.12, 0.28), (x, -0.18, 2.72 if index < 2 else 1.83), graphite, 0.045)

trace("TRACE_AQUA_1", [(-1.15, -0.235, 2.12), (-0.64, -0.235, 2.12), (-0.64, -0.235, 2.55), (-0.35, -0.235, 2.55)], aqua, 0.014)
trace("TRACE_AQUA_2", [(0.82, -0.235, 2.0), (1.25, -0.235, 2.0), (1.25, -0.235, 2.72), (0.93, -0.235, 2.72)], aqua, 0.012)
trace("TRACE_CORAL", [(-1.16, -0.23, 0.98), (-0.82, -0.23, 0.98), (-0.82, -0.23, 1.74), (-0.49, -0.23, 1.74)], coral, 0.014)

for ring in range(5):
    torus(f"CHARGING_COIL_{ring}", 0.59 - ring * 0.095, 0.024, (0.47, -0.13, -2.45), copper)
rounded_box("COIL_BRIDGE", (1.42, 0.06, 0.12), (0.15, -0.16, -1.67), copper, 0.035)
for index in range(6):
    angle_x = -0.95 + index * 0.38
    rounded_box(f"LOWER_CONTACT_{index}", (0.16, 0.055, 0.3), (angle_x, -0.2, -3.05), gold, 0.03)

for name, size, location in (
    ("MIDFRAME_LEFT", (0.18, 0.15, 6.92), (-1.67, -0.19, 0)),
    ("MIDFRAME_RIGHT", (0.18, 0.15, 6.92), (1.67, -0.19, 0)),
    ("MIDFRAME_TOP", (3.28, 0.15, 0.2), (0, -0.19, 3.54)),
    ("MIDFRAME_BOTTOM", (3.28, 0.15, 0.2), (0, -0.19, -3.54)),
):
    midframe = rounded_box(name, size, location, graphite, 0.075)
    midframe["assembly_layer"] = "midframe"
rounded_box("MIDFRAME_AQUA_EDGE", (3.36, 0.035, 0.065), (0, -0.285, -3.5), aqua, 0.02)
rounded_box("MIDFRAME_CORAL_EDGE", (3.36, 0.035, 0.065), (0, -0.285, 3.5), coral, 0.02)

for name, size, location in (
    ("METAL_FRAME_LEFT", (0.2, 0.38, 7.14), (-1.77, -0.31, 0)),
    ("METAL_FRAME_RIGHT", (0.2, 0.38, 7.14), (1.77, -0.31, 0)),
    ("METAL_FRAME_TOP", (3.38, 0.38, 0.24), (0, -0.31, 3.67)),
    ("METAL_FRAME_BOTTOM", (3.38, 0.38, 0.24), (0, -0.31, -3.67)),
):
    frame = rounded_box(name, size, location, steel, 0.09)
    frame["assembly_layer"] = "frame"
inner = rounded_box("DISPLAY_BED", (3.52, 0.17, 7.34), (0, -0.53, 0), graphite, 0.25)
inner["assembly_layer"] = "frame"

display = rounded_box("OLED_PANEL", (3.44, 0.075, 7.18), (0, -0.65, 0), black, 0.235)
display["assembly_layer"] = "display"
glass = rounded_box("DISPLAY_GLASS", (3.5, 0.055, 7.25), (0, -0.72, 0), black, 0.25)
glass["assembly_layer"] = "glass"

# Punch-hole camera, earpiece and tactile edge details.
cylinder("SELFIE_RING", 0.095, 0.028, (0, -0.77, 3.17), steel, vertices=48)
cylinder("SELFIE_LENS", 0.065, 0.035, (0, -0.79, 3.17), black, vertices=48)
rounded_box("EARPIECE", (0.68, 0.035, 0.055), (0, -0.785, 3.48), graphite, 0.02)

rounded_box("VOLUME_BUTTON", (0.09, 0.23, 0.82), (1.89, -0.31, 1.4), steel, 0.04)
rounded_box("POWER_BUTTON", (0.105, 0.24, 0.52), (1.9, -0.31, 0.52), aqua, 0.045)
for index, x in enumerate((-1.18, -0.94, -0.7, -0.46, 0.46, 0.7, 0.94, 1.18)):
    cylinder(f"SPEAKER_HOLE_{index}", 0.035, 0.08, (x, -0.31, -3.78), black, rotation=(0, 0, 0), vertices=24)
rounded_box("USB_C_PORT", (0.66, 0.2, 0.11), (0, -0.31, -3.77), black, 0.05)
cylinder("MIC_HOLE", 0.035, 0.085, (1.43, -0.31, -3.78), black, rotation=(0, 0, 0), vertices=24)

for index, z in enumerate((-2.65, 2.65)):
    rounded_box(f"ANTENNA_LEFT_{index}", (0.065, 0.395, 0.28), (-1.86, -0.31, z), paper, 0.025)
    rounded_box(f"ANTENNA_RIGHT_{index}", (0.065, 0.395, 0.28), (1.86, -0.31, z), paper, 0.025)

# Metadata used by the runtime and future asset audits.
for obj in bpy.context.scene.objects:
    if obj.type in {"MESH", "CURVE"}:
        obj["blabb_original_asset"] = True

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
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

print(f"Generated {OUTPUT}")
