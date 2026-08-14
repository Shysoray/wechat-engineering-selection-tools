const materialOptions = [
  {
    "code": "SS",
    "name": "316L Stainless Steel",
    "label": "SS / 316L 不锈钢"
  },
  {
    "code": "Ni",
    "name": "Nickel",
    "label": "Ni / 镍"
  },
  {
    "code": "H",
    "name": "Hastelloy C-22",
    "label": "H / Hastelloy C-22"
  },
  {
    "code": "PCTFE",
    "name": "Polychlorotrifluoroethylene",
    "label": "PCTFE / 聚三氟氯乙烯"
  },
  {
    "code": "VESPEL",
    "name": "DuPont Vespel SP-1 Polyimide",
    "label": "PI / Vespel SP-1"
  }
]

const msdsGases = [
  {
    "id": "acetylene",
    "index": "1",
    "cnName": "乙炔",
    "enName": "Acetylene",
    "formula": "C2H2",
    "cas": "74-86-2",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "250",
      "bar": 17.24,
      "mpa": 1.724
    },
    "molarMass": 26.038,
    "n2Factor": 0.964,
    "fromN2Factor": 1.037,
    "airSpecificGravity": 0.906,
    "msdsSummary": "可燃",
    "hazards": {
      "health": "0",
      "flammability": "4",
      "reactivity": "3"
    },
    "limits": {
      "lfl": 0.025,
      "ufl": "1",
      "autoIgnitionF": "581",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.1
    },
    "cylinderConnections": "CGA510",
    "compatibleMaterialText": "Vespel SP-1",
    "compatibleMaterials": [
      "VESPEL"
    ],
    "processes": "",
    "exhaustTreatment": "热处理",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "unknown",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质。资料说明除 N2、He 和洁净干燥空气外主要依据外部推荐，且公开数据有限；实际工况仍须由气体及设备供应商确认。"
    }
  },
  {
    "id": "ammonia",
    "index": "2",
    "cnName": "氨气",
    "enName": "Ammonia",
    "formula": "NH3",
    "cas": "7664-41-7",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 114.286,
      "bar": 7.88,
      "mpa": 0.788
    },
    "molarMass": 17.031,
    "n2Factor": 0.78,
    "fromN2Factor": 1.282,
    "airSpecificGravity": 0.593,
    "msdsSummary": "腐蚀性、低毒、可燃",
    "hazards": {
      "health": "3",
      "flammability": "1",
      "reactivity": "0"
    },
    "limits": {
      "lfl": 0.15,
      "ufl": 0.28,
      "autoIgnitionF": "1562",
      "lc50": "7338",
      "idlh": "500",
      "tlvTwa": "25",
      "osha": "50"
    },
    "classes": {
      "tgo": "II",
      "dot": 2.2
    },
    "cylinderConnections": "CGA660, DISS720",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "LPCVD；LPCVD介质；PECVD",
    "exhaustTreatment": "湿式洗涤",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "argon",
    "index": "3",
    "cnName": "氩气",
    "enName": "Argon",
    "formula": "Ar",
    "cas": "7440-37-1",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "2640",
      "bar": 182.02,
      "mpa": 18.202
    },
    "molarMass": 39.948,
    "n2Factor": 1.194,
    "fromN2Factor": 0.837,
    "airSpecificGravity": 1.38,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "CGA580, DISS718, G5/8\"",
    "compatibleMaterialText": "SS/Ni/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "Ni",
      "VESPEL"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "verified",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质。资料说明除 N2、He 和洁净干燥空气外主要依据外部推荐，且公开数据有限；实际工况仍须由气体及设备供应商确认。"
    }
  },
  {
    "id": "arsine",
    "index": "4",
    "cnName": "砷烷",
    "enName": "Arsine",
    "formula": "AsH3",
    "cas": "7784-42-1",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 203.145,
      "bar": 14.01,
      "mpa": 1.401
    },
    "molarMass": 77.946,
    "n2Factor": 1.668,
    "fromN2Factor": 0.599,
    "airSpecificGravity": 2.695,
    "msdsSummary": "高毒、可燃",
    "hazards": {
      "health": "4",
      "flammability": "4",
      "reactivity": "2"
    },
    "limits": {
      "lfl": 0.051,
      "ufl": 0.78,
      "autoIgnitionF": "-",
      "lc50": "20",
      "idlh": "6",
      "tlvTwa": 0.05,
      "osha": 0.05
    },
    "classes": {
      "tgo": "I",
      "dot": 2.3
    },
    "cylinderConnections": "DISS632, CGA350",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "掺杂(Dopant)",
    "exhaustTreatment": "干式吸附；热处理",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "boron-tribromide",
    "index": "5",
    "cnName": "三溴化硼",
    "enName": "Boron Tribromide",
    "formula": "BBr3",
    "cas": "10294-33-4",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": -13.72,
      "bar": -0.95,
      "mpa": -0.095
    },
    "molarMass": 250.537,
    "n2Factor": 2.991,
    "fromN2Factor": 0.334,
    "airSpecificGravity": 2.638,
    "msdsSummary": "腐蚀性、有毒、遇水反应",
    "hazards": {
      "health": "3",
      "flammability": "0",
      "reactivity": "2"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "380",
      "idlh": "50",
      "tlvTwa": "1",
      "osha": ""
    },
    "classes": {
      "tgo": "II",
      "dot": "8"
    },
    "cylinderConnections": "",
    "compatibleMaterialText": "Ni/H（初筛）",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "",
    "exhaustTreatment": "湿式洗涤",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。 常用钢瓶接头缺失，需按地区标准/供应商确认。；材质为工程初筛：参照同族 BCl3/BF3 的现有 AP Tech 记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "参照同族 BCl3/BF3 的现有 AP Tech 记录"
  },
  {
    "id": "boron-trichloride",
    "index": "6",
    "cnName": "三氯化硼",
    "enName": "Boron Trichloride",
    "formula": "BCl3",
    "cas": "10294-34-5",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 5.203,
      "bar": 0.36,
      "mpa": 0.036
    },
    "molarMass": 117.17,
    "n2Factor": 2.045,
    "fromN2Factor": 0.489,
    "airSpecificGravity": 4.04,
    "msdsSummary": "腐蚀性、有毒",
    "hazards": {
      "health": "3",
      "flammability": "",
      "reactivity": "1"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "2541",
      "idlh": "NL",
      "tlvTwa": "5",
      "osha": "5"
    },
    "classes": {
      "tgo": "II",
      "dot": 2.3
    },
    "cylinderConnections": "DISS634, CGA660",
    "compatibleMaterialText": "Ni/H",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "刻蚀(Etchant)",
    "exhaustTreatment": "湿式洗涤",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "boron-trifluoride",
    "index": "7",
    "cnName": "三氟化硼",
    "enName": "Boron Trifluoride",
    "formula": "BF3",
    "cas": "7637-07-2",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "800",
      "bar": 55.16,
      "mpa": 5.516
    },
    "molarMass": 67.8,
    "n2Factor": 1.556,
    "fromN2Factor": 0.643,
    "airSpecificGravity": 2.32,
    "msdsSummary": "腐蚀性、有毒",
    "hazards": {
      "health": "4",
      "flammability": "0",
      "reactivity": "1"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "806",
      "idlh": "100",
      "tlvTwa": "",
      "osha": "1"
    },
    "classes": {
      "tgo": "II",
      "dot": 2.3
    },
    "cylinderConnections": "DiSS642 CGA330",
    "compatibleMaterialText": "Ni/H",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "",
    "exhaustTreatment": "湿式洗涤",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "boron-11-trifluoride",
    "index": "8",
    "cnName": "三氟化十一硼",
    "enName": "Boron-11 Trifluoride",
    "formula": "B11F3",
    "cas": "",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "417",
      "bar": 28.75,
      "mpa": 2.875
    },
    "molarMass": 67.98,
    "n2Factor": 1.558,
    "fromN2Factor": 0.642,
    "airSpecificGravity": 2.356,
    "msdsSummary": "腐蚀性、有毒",
    "hazards": {
      "health": "4",
      "flammability": "0",
      "reactivity": "1"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "806",
      "idlh": "100",
      "tlvTwa": "",
      "osha": "1"
    },
    "classes": {
      "tgo": "II",
      "dot": 2.3
    },
    "cylinderConnections": "",
    "compatibleMaterialText": "Ni/H（初筛）",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "",
    "exhaustTreatment": "湿式洗涤",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。 常用钢瓶接头缺失，需按地区标准/供应商确认。；材质为工程初筛：同位素气体，参照 BF3 的现有 AP Tech 记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "同位素气体，参照 BF3 的现有 AP Tech 记录"
  },
  {
    "id": "carbon-dioxide",
    "index": "9",
    "cnName": "二氧化碳",
    "enName": "Carbon Dioxide",
    "formula": "CO2",
    "cas": "124-38-9",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 838.123,
      "bar": 57.79,
      "mpa": 5.779
    },
    "molarMass": 44.009,
    "n2Factor": 1.253,
    "fromN2Factor": 0.798,
    "airSpecificGravity": 1.527,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "DISS716, CGA320",
    "compatibleMaterialText": "SS/Ni/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "Ni",
      "VESPEL"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "verified",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质。资料说明除 N2、He 和洁净干燥空气外主要依据外部推荐，且公开数据有限；实际工况仍须由气体及设备供应商确认。"
    }
  },
  {
    "id": "carbon-monoxide",
    "index": "10",
    "cnName": "一氧化碳",
    "enName": "Carbon Monoxide",
    "formula": "CO",
    "cas": "630-08-0",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "2000",
      "bar": 137.9,
      "mpa": 13.79
    },
    "molarMass": 28.01,
    "n2Factor": "1",
    "fromN2Factor": "1",
    "airSpecificGravity": 0.967,
    "msdsSummary": "低毒、可燃",
    "hazards": {
      "health": "3",
      "flammability": "4",
      "reactivity": "0"
    },
    "limits": {
      "lfl": 0.12,
      "ufl": 0.75,
      "autoIgnitionF": "1292",
      "lc50": "3760",
      "idlh": "1500",
      "tlvTwa": "25",
      "osha": ""
    },
    "classes": {
      "tgo": "III",
      "dot": 2.3
    },
    "cylinderConnections": "DISS724, CGA350",
    "compatibleMaterialText": "SS/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "VESPEL"
    ],
    "processes": "",
    "exhaustTreatment": "热处理",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "verified",
    "incompatibleMaterials": [
      "Ni"
    ],
    "incompatibilityBasis": "CO 与 Ni 存在生成高毒性羰基镍的风险",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质。资料说明除 N2、He 和洁净干燥空气外主要依据外部推荐，且公开数据有限；实际工况仍须由气体及设备供应商确认。"
    }
  },
  {
    "id": "chlorine",
    "index": "11",
    "cnName": "氯气",
    "enName": "Chlorine",
    "formula": "Cl2",
    "cas": "7782-50-5",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 83.665,
      "bar": 5.77,
      "mpa": 0.577
    },
    "molarMass": 70.906,
    "n2Factor": 1.591,
    "fromN2Factor": 0.629,
    "airSpecificGravity": 1.57,
    "msdsSummary": "氧化性、腐蚀性、有毒",
    "hazards": {
      "health": "4",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "293",
      "idlh": "30",
      "tlvTwa": 0.5,
      "osha": "1"
    },
    "classes": {
      "tgo": "II",
      "dot": 2.3
    },
    "cylinderConnections": "DISS728, CGA660",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "刻蚀(Etchant)",
    "exhaustTreatment": "湿式洗涤",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "chlorine-trifluoride",
    "index": "12",
    "cnName": "三氟化氯",
    "enName": "Chlorine Trifluoride",
    "formula": "ClF3",
    "cas": "7790-91-2",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 5.797,
      "bar": 0.4,
      "mpa": 0.04
    },
    "molarMass": 92.5,
    "n2Factor": 1.817,
    "fromN2Factor": 0.55,
    "airSpecificGravity": 3.14,
    "msdsSummary": "氧化性、腐蚀性、有毒、遇水反应",
    "hazards": {
      "health": "4",
      "flammability": "0",
      "reactivity": "3"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "299",
      "idlh": "20",
      "tlvTwa": 0.1,
      "osha": 0.1
    },
    "classes": {
      "tgo": "I",
      "dot": 2.3
    },
    "cylinderConnections": "",
    "compatibleMaterialText": "Ni/H（初筛）",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "",
    "exhaustTreatment": "湿式洗涤",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。 常用钢瓶接头缺失，需按地区标准/供应商确认。；材质为工程初筛：强氧化含氟气体，参照 F2 的现有 AP Tech 记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "强氧化含氟气体，参照 F2 的现有 AP Tech 记录"
  },
  {
    "id": "deuterium",
    "index": "13",
    "cnName": "氘气",
    "enName": "Deuterium",
    "formula": "D2",
    "cas": "7782-39-0",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "1660",
      "bar": 114.45,
      "mpa": 11.445
    },
    "molarMass": 4.032,
    "n2Factor": 0.379,
    "fromN2Factor": 2.636,
    "airSpecificGravity": 0.139,
    "msdsSummary": "可燃",
    "hazards": {
      "health": "0",
      "flammability": "4",
      "reactivity": "0"
    },
    "limits": {
      "lfl": 0.049,
      "ufl": 0.75,
      "autoIgnitionF": "1058",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.1
    },
    "cylinderConnections": "CGA350",
    "compatibleMaterialText": "SS/Ni（初筛）",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "热处理",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。；材质为工程初筛：同位素气体，参照 H2 的现有 AP Tech 记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "同位素气体，参照 H2 的现有 AP Tech 记录"
  },
  {
    "id": "diborane",
    "index": "14",
    "cnName": "硼烷",
    "enName": "Diborane",
    "formula": "B2H6",
    "cas": "19287-45-7",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "2100",
      "bar": 144.79,
      "mpa": 14.479
    },
    "molarMass": 27.7,
    "n2Factor": 0.994,
    "fromN2Factor": 1.006,
    "airSpecificGravity": 0.95,
    "msdsSummary": "腐蚀性、高毒、可燃、自燃、遇水反应",
    "hazards": {
      "health": "4",
      "flammability": "4",
      "reactivity": "3"
    },
    "limits": {
      "lfl": 0.008,
      "ufl": 0.88,
      "autoIgnitionF": "104",
      "lc50": "80",
      "idlh": "40",
      "tlvTwa": 0.1,
      "osha": 0.1
    },
    "classes": {
      "tgo": "II",
      "dot": 2.3
    },
    "cylinderConnections": "DISS632, CGA350",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "掺杂(Dopant)",
    "exhaustTreatment": "湿式洗涤；干式吸附；热处理",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "dichlorosilane",
    "index": "15",
    "cnName": "DCS/ 二氯二氢硅",
    "enName": "Dichlorosilane",
    "formula": "SiH2Cl2",
    "cas": "4109-96-0",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 9.5,
      "bar": 0.66,
      "mpa": 0.066
    },
    "molarMass": "101",
    "n2Factor": 1.899,
    "fromN2Factor": 0.527,
    "airSpecificGravity": 3.47,
    "msdsSummary": "腐蚀性、有毒、可燃、遇水反应",
    "hazards": {
      "health": "4",
      "flammability": "4",
      "reactivity": "2"
    },
    "limits": {
      "lfl": 0.047,
      "ufl": 0.96,
      "autoIgnitionF": "212",
      "lc50": "314",
      "idlh": "100",
      "tlvTwa": "5",
      "osha": "5"
    },
    "classes": {
      "tgo": "II",
      "dot": 2.3
    },
    "cylinderConnections": "DISS636,CGA678",
    "compatibleMaterialText": "Ni/H",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "外延(Epitaxy)；LPCVD；LPCVD介质",
    "exhaustTreatment": "湿式洗涤；热处理",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "disilane",
    "index": "16",
    "cnName": "乙硅烷",
    "enName": "Disilane",
    "formula": "Si2H6",
    "cas": "1590-87-0",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": "35",
      "bar": 2.41,
      "mpa": 0.241
    },
    "molarMass": 62.22,
    "n2Factor": 1.49,
    "fromN2Factor": 0.671,
    "airSpecificGravity": 2.1,
    "msdsSummary": "可燃、自燃",
    "hazards": {
      "health": "0",
      "flammability": "4",
      "reactivity": "3"
    },
    "limits": {
      "lfl": 0.02,
      "ufl": 0.98,
      "autoIgnitionF": "-148",
      "lc50": "19k",
      "idlh": "NL",
      "tlvTwa": "5",
      "osha": "5"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.1
    },
    "cylinderConnections": "CGA632",
    "compatibleMaterialText": "SS/Ni（初筛）/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "Ni",
      "VESPEL"
    ],
    "processes": "",
    "exhaustTreatment": "硅烷排放",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。；材质为工程初筛：参照 SiH4/GeH4 的现有 AP Tech 记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "参照 SiH4/GeH4 的现有 AP Tech 记录",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质。资料说明除 N2、He 和洁净干燥空气外主要依据外部推荐，且公开数据有限；实际工况仍须由气体及设备供应商确认。"
    }
  },
  {
    "id": "f-11",
    "index": "17",
    "cnName": "三氯氟甲烷",
    "enName": "F-11",
    "formula": "CCl3F",
    "cas": "75-69-4",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": -1.183,
      "bar": -0.08,
      "mpa": -0.008
    },
    "molarMass": 137.368,
    "n2Factor": 2.215,
    "fromN2Factor": 0.452,
    "airSpecificGravity": 4.49,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "DISS716,CGA660",
    "compatibleMaterialText": "SS/Ni（初筛）",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。；材质为工程初筛：参照现有卤代烃/氟碳气体记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "参照现有卤代烃/氟碳气体记录"
  },
  {
    "id": "f-115",
    "index": "18",
    "cnName": "一氯五氟乙烷",
    "enName": "F-115",
    "formula": "C2ClF5",
    "cas": "76-15-3",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 429.6,
      "bar": 29.62,
      "mpa": 2.962
    },
    "molarMass": 154.45,
    "n2Factor": 2.348,
    "fromN2Factor": 0.426,
    "airSpecificGravity": 5.354,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "DISS716,CGA660",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；PubChem https://pubchem.ncbi.nlm.nih.gov/compound/6430",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "f-116-hexafluoroethane",
    "index": "19",
    "cnName": "六氟乙烷",
    "enName": "F-116 [Hexafluoroethane]",
    "formula": "C2F6",
    "cas": "76-16-4",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 417.5,
      "bar": 28.79,
      "mpa": 2.879
    },
    "molarMass": 138.01,
    "n2Factor": 2.22,
    "fromN2Factor": 0.451,
    "airSpecificGravity": 4.82,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "DISS716,CGA660",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "f-12",
    "index": "20",
    "cnName": "二氯二氟甲烷",
    "enName": "F-12",
    "formula": "CCl2F2",
    "cas": "75-71-8",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 69.65,
      "bar": 4.8,
      "mpa": 0.48
    },
    "molarMass": 120.913,
    "n2Factor": 2.078,
    "fromN2Factor": 0.481,
    "airSpecificGravity": 4.262,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "DISS716,CGA660",
    "compatibleMaterialText": "SS/Ni（初筛）",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。；材质为工程初筛：参照现有卤代烃/氟碳气体记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "参照现有卤代烃/氟碳气体记录"
  },
  {
    "id": "f-13",
    "index": "21",
    "cnName": "一氯三氟甲烷",
    "enName": "F-13",
    "formula": "CClF3",
    "cas": "75-72-9",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": "459",
      "bar": 31.65,
      "mpa": 3.165
    },
    "molarMass": 104.46,
    "n2Factor": 1.931,
    "fromN2Factor": 0.518,
    "airSpecificGravity": 3.64,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "DISS716,CGA330",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "f-13-b1",
    "index": "22",
    "cnName": "三氟溴甲烷",
    "enName": "F-13 B1",
    "formula": "CBrF3",
    "cas": "75-63-8",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": "190",
      "bar": 13.1,
      "mpa": 1.31
    },
    "molarMass": 104.46,
    "n2Factor": 1.931,
    "fromN2Factor": 0.518,
    "airSpecificGravity": 3.621,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "",
    "compatibleMaterialText": "SS/Ni（初筛）",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。 常用钢瓶接头缺失，需按地区标准/供应商确认。；材质为工程初筛：参照现有卤代烃/氟碳气体记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；PubChem https://pubchem.ncbi.nlm.nih.gov/compound/6384",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "参照现有卤代烃/氟碳气体记录"
  },
  {
    "id": "f-14",
    "index": "23",
    "cnName": "四氟化碳",
    "enName": "F-14",
    "formula": "CF4",
    "cas": "75-73-0",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "2000",
      "bar": 137.9,
      "mpa": 13.79
    },
    "molarMass": 88.003,
    "n2Factor": 1.773,
    "fromN2Factor": 0.564,
    "airSpecificGravity": 3.04,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "CGA320",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "f-218-perfluoropropane",
    "index": "24",
    "cnName": "全氟丙烷",
    "enName": "F-218 [Perfluoropropane]",
    "formula": "C3F8",
    "cas": "76-19-7",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 98.1,
      "bar": 6.76,
      "mpa": 0.676
    },
    "molarMass": 188.017,
    "n2Factor": 2.591,
    "fromN2Factor": 0.386,
    "airSpecificGravity": 6.652,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "DISS716,CGA660",
    "compatibleMaterialText": "SS/Ni/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "Ni",
      "VESPEL"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "verified",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质。资料说明除 N2、He 和洁净干燥空气外主要依据外部推荐，且公开数据有限；实际工况仍须由气体及设备供应商确认。"
    }
  },
  {
    "id": "f-23",
    "index": "25",
    "cnName": "三氟甲烷",
    "enName": "F-23",
    "formula": "CHF3",
    "cas": "75-46-7",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 611.267,
      "bar": 42.15,
      "mpa": 4.215
    },
    "molarMass": 70.013,
    "n2Factor": 1.581,
    "fromN2Factor": 0.633,
    "airSpecificGravity": 2.436,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "DISS716",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "f-32",
    "index": "26",
    "cnName": "二氟甲烷",
    "enName": "F-32",
    "formula": "CH2F2",
    "cas": "75-10-5",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 232.3,
      "bar": 16.02,
      "mpa": 1.602
    },
    "molarMass": 52.02,
    "n2Factor": 1.363,
    "fromN2Factor": 0.734,
    "airSpecificGravity": 1.803,
    "msdsSummary": "可燃",
    "hazards": {
      "health": "0",
      "flammability": "4",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "",
      "ufl": "",
      "autoIgnitionF": "",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.1
    },
    "cylinderConnections": "DISS724",
    "compatibleMaterialText": "SS/Ni（初筛）",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "热处理",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。；材质为工程初筛：参照 F-41 等现有氟代烃记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；PubChem https://pubchem.ncbi.nlm.nih.gov/compound/6345",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "参照 F-41 等现有氟代烃记录"
  },
  {
    "id": "f-41-methyl-fluoride",
    "index": "27",
    "cnName": "一氟甲烷",
    "enName": "F-41 [Methyl fluoride]",
    "formula": "CH3F",
    "cas": "593-53-3",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": "538",
      "bar": 37.09,
      "mpa": 3.709
    },
    "molarMass": 34.03,
    "n2Factor": 1.102,
    "fromN2Factor": 0.907,
    "airSpecificGravity": 1.18,
    "msdsSummary": "可燃",
    "hazards": {
      "health": "0",
      "flammability": "4",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "",
      "ufl": "",
      "autoIgnitionF": "",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.1
    },
    "cylinderConnections": "DISS724",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "热处理",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；PubChem https://pubchem.ncbi.nlm.nih.gov/compound/11638",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "f-c318-octafluorocyclobutane",
    "index": "28",
    "cnName": "八氟化四碳",
    "enName": "F-C318 [Octafluorocyclobutane]",
    "formula": "C4F8",
    "cas": "115-25-3",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": "25",
      "bar": 1.72,
      "mpa": 0.172
    },
    "molarMass": 200.03,
    "n2Factor": 2.672,
    "fromN2Factor": 0.374,
    "airSpecificGravity": 7.33,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "DIss716,CGA660",
    "compatibleMaterialText": "SS/Ni（初筛）",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。；材质为工程初筛：参照 F-14/F-116/F-218 等现有全氟烃记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "参照 F-14/F-116/F-218 等现有全氟烃记录"
  },
  {
    "id": "fluorine",
    "index": "29",
    "cnName": "氟气",
    "enName": "Fluorine",
    "formula": "F2",
    "cas": "7782-41-4",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "400",
      "bar": 27.58,
      "mpa": 2.758
    },
    "molarMass": 37.996,
    "n2Factor": 1.165,
    "fromN2Factor": 0.859,
    "airSpecificGravity": 1.31,
    "msdsSummary": "氧化性、腐蚀性、高毒、遇水反应",
    "hazards": {
      "health": "4",
      "flammability": "0",
      "reactivity": "4"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "185",
      "idlh": "25",
      "tlvTwa": "1",
      "osha": "1"
    },
    "classes": {
      "tgo": "II",
      "dot": 2.3
    },
    "cylinderConnections": "CGA679",
    "compatibleMaterialText": "Ni/H",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "",
    "exhaustTreatment": "湿式洗涤",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "germane",
    "index": "30",
    "cnName": "锗烷",
    "enName": "Germane",
    "formula": "GeH4",
    "cas": "7782-65-2",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "638",
      "bar": 43.99,
      "mpa": 4.399
    },
    "molarMass": 76.6,
    "n2Factor": 1.654,
    "fromN2Factor": 0.605,
    "airSpecificGravity": 2.65,
    "msdsSummary": "有毒、可燃、自燃",
    "hazards": {
      "health": "4",
      "flammability": "4",
      "reactivity": "3"
    },
    "limits": {
      "lfl": 0.08,
      "ufl": 0.3,
      "autoIgnitionF": "130",
      "lc50": "571",
      "idlh": "20",
      "tlvTwa": 0.2,
      "osha": 0.6
    },
    "classes": {
      "tgo": "I",
      "dot": 2.3
    },
    "cylinderConnections": "DISS632, CGA350",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "热处理",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "helium",
    "index": "31",
    "cnName": "氦气",
    "enName": "Helium",
    "formula": "He",
    "cas": "7440-59-7",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "2640",
      "bar": 182.02,
      "mpa": 18.202
    },
    "molarMass": 4.003,
    "n2Factor": 0.378,
    "fromN2Factor": 2.645,
    "airSpecificGravity": 0.138,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "DISS718, CGA326, G5/8\"",
    "compatibleMaterialText": "SS/Ni/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "Ni",
      "VESPEL"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "verified",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质，并说明具备该介质的测试能力；实际应用仍须结合温度、压力、纯度及动态循环确认。"
    }
  },
  {
    "id": "hydrogen",
    "index": "32",
    "cnName": "氢气",
    "enName": "Hydrogen",
    "formula": "H2",
    "cas": "1333-74-0",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "2640",
      "bar": 182.02,
      "mpa": 18.202
    },
    "molarMass": 2.016,
    "n2Factor": 0.268,
    "fromN2Factor": 3.727,
    "airSpecificGravity": 0.071,
    "msdsSummary": "可燃",
    "hazards": {
      "health": "0",
      "flammability": "4",
      "reactivity": "0"
    },
    "limits": {
      "lfl": 0.04,
      "ufl": 0.75,
      "autoIgnitionF": "887",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.1
    },
    "cylinderConnections": "DISS724, CGA350, W21.8-左",
    "compatibleMaterialText": "SS/Ni/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "Ni",
      "VESPEL"
    ],
    "processes": "外延(Epitaxy)；LPCVD；LPCVD钨；PECVD",
    "exhaustTreatment": "热处理",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "verified",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质。资料说明除 N2、He 和洁净干燥空气外主要依据外部推荐，且公开数据有限；实际工况仍须由气体及设备供应商确认。"
    }
  },
  {
    "id": "hydrogen-bromide",
    "index": "33",
    "cnName": "溴化氢",
    "enName": "Hydrogen Bromide",
    "formula": "HBr",
    "cas": "10035-10-6",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 301.256,
      "bar": 20.77,
      "mpa": 2.077
    },
    "molarMass": 80.917,
    "n2Factor": 1.7,
    "fromN2Factor": 0.588,
    "airSpecificGravity": 3.5,
    "msdsSummary": "腐蚀性、有毒",
    "hazards": {
      "health": "3",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "2860",
      "idlh": "50",
      "tlvTwa": "3",
      "osha": "3"
    },
    "classes": {
      "tgo": "II",
      "dot": "8"
    },
    "cylinderConnections": "DISS634, CGA330",
    "compatibleMaterialText": "Ni/H",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "刻蚀(Etchant)",
    "exhaustTreatment": "湿式洗涤",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "hydrogen-chloride",
    "index": "34",
    "cnName": "氯化氢",
    "enName": "Hydrogen Chloride",
    "formula": "HCl",
    "cas": "7647-01-0",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 614.399,
      "bar": 42.36,
      "mpa": 4.236
    },
    "molarMass": 36.5,
    "n2Factor": 1.142,
    "fromN2Factor": 0.876,
    "airSpecificGravity": 1.19,
    "msdsSummary": "腐蚀性、低毒",
    "hazards": {
      "health": "3",
      "flammability": "0",
      "reactivity": "1"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "3120",
      "idlh": "100",
      "tlvTwa": "5",
      "osha": "5"
    },
    "classes": {
      "tgo": "II",
      "dot": 2.3
    },
    "cylinderConnections": "DISS634, CGA330",
    "compatibleMaterialText": "Ni/H",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "刻蚀(Etchant)；外延(Epitaxy)",
    "exhaustTreatment": "湿式洗涤",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "hydrogen-fluoride",
    "index": "35",
    "cnName": "氟化氢",
    "enName": "Hydrogen Fluoride",
    "formula": "HF",
    "cas": "7664-39-3",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 0.9,
      "bar": 0.06,
      "mpa": 0.006
    },
    "molarMass": 20.006,
    "n2Factor": 0.845,
    "fromN2Factor": 1.183,
    "airSpecificGravity": 0.99,
    "msdsSummary": "腐蚀性、有毒",
    "hazards": {
      "health": "4",
      "flammability": "0",
      "reactivity": "1"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "1300",
      "idlh": "30",
      "tlvTwa": "3",
      "osha": "3"
    },
    "classes": {
      "tgo": "II",
      "dot": "8"
    },
    "cylinderConnections": "DISS638, CGA660",
    "compatibleMaterialText": "Ni/H",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "",
    "exhaustTreatment": "湿式洗涤",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "hydrogen-iodide",
    "index": "36",
    "cnName": "碘化氢",
    "enName": "Hydrogen Iodide",
    "formula": "H2I",
    "cas": "10034-85-2",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": "95",
      "bar": 6.55,
      "mpa": 0.655
    },
    "molarMass": 127.93,
    "n2Factor": 2.137,
    "fromN2Factor": 0.468,
    "airSpecificGravity": 4.5,
    "msdsSummary": "腐蚀性、有毒",
    "hazards": {
      "health": "3",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "",
      "idlh": "",
      "tlvTwa": "",
      "osha": ""
    },
    "classes": {
      "tgo": "",
      "dot": 2.2
    },
    "cylinderConnections": "",
    "compatibleMaterialText": "Ni/H（初筛）",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "",
    "exhaustTreatment": "湿式洗涤",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。 常用钢瓶接头缺失，需按地区标准/供应商确认。；材质为工程初筛：参照 HCl/HBr/HF 的现有 AP Tech 记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "参照 HCl/HBr/HF 的现有 AP Tech 记录"
  },
  {
    "id": "hydrogen-selenide",
    "index": "37",
    "cnName": "硒化氢",
    "enName": "Hydrogen Selenide",
    "formula": "H2Se",
    "cas": "7783-07-5",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 125.3,
      "bar": 8.64,
      "mpa": 0.864
    },
    "molarMass": 80.98,
    "n2Factor": 1.7,
    "fromN2Factor": 0.588,
    "airSpecificGravity": 2.12,
    "msdsSummary": "腐蚀性、高毒、可燃",
    "hazards": {
      "health": "4",
      "flammability": "3",
      "reactivity": "3"
    },
    "limits": {
      "lfl": "",
      "ufl": "",
      "autoIgnitionF": "",
      "lc50": "2",
      "idlh": "2",
      "tlvTwa": 0.05,
      "osha": 0.05
    },
    "classes": {
      "tgo": "I",
      "dot": 2.3
    },
    "cylinderConnections": "",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "干式吸附；热处理",
    "notes": "常用钢瓶接头缺失，需按地区标准/供应商确认。",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "hydrogen-sulfide",
    "index": "38",
    "cnName": "硫化氢",
    "enName": "Hydrogen Sulfide",
    "formula": "H2S",
    "cas": "7783-06-4",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 248.851,
      "bar": 17.16,
      "mpa": 1.716
    },
    "molarMass": 34.076,
    "n2Factor": 1.103,
    "fromN2Factor": 0.907,
    "airSpecificGravity": 1.192,
    "msdsSummary": "有毒、可燃",
    "hazards": {
      "health": "4",
      "flammability": "4",
      "reactivity": "0"
    },
    "limits": {
      "lfl": 0.043,
      "ufl": 0.46,
      "autoIgnitionF": "500",
      "lc50": "712",
      "idlh": "300",
      "tlvTwa": "10",
      "osha": "15"
    },
    "classes": {
      "tgo": "II",
      "dot": 2.3
    },
    "cylinderConnections": "DISS722, CGA330",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "干式吸附；热处理",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "methane",
    "index": "39",
    "cnName": "甲烷",
    "enName": "Methane",
    "formula": "CH4",
    "cas": "74-82-8",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "2400",
      "bar": 165.47,
      "mpa": 16.547
    },
    "molarMass": 16.043,
    "n2Factor": 0.757,
    "fromN2Factor": 1.321,
    "airSpecificGravity": 0.555,
    "msdsSummary": "可燃",
    "hazards": {
      "health": "0",
      "flammability": "4",
      "reactivity": "0"
    },
    "limits": {
      "lfl": 0.05,
      "ufl": 0.15,
      "autoIgnitionF": "1076",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.1
    },
    "cylinderConnections": "W21.8-左旋(国产)",
    "compatibleMaterialText": "SS/Ni/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "Ni",
      "VESPEL"
    ],
    "processes": "",
    "exhaustTreatment": "热处理",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "verified",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质。资料说明除 N2、He 和洁净干燥空气外主要依据外部推荐，且公开数据有限；实际工况仍须由气体及设备供应商确认。"
    }
  },
  {
    "id": "methylsilane",
    "index": "40",
    "cnName": "甲基硅烷",
    "enName": "Methylsilane",
    "formula": "CH6Si",
    "cas": "992-94-9",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": "192",
      "bar": 13.24,
      "mpa": 1.324
    },
    "molarMass": 46.145,
    "n2Factor": 1.284,
    "fromN2Factor": 0.779,
    "airSpecificGravity": 1.59,
    "msdsSummary": "可燃、自燃",
    "hazards": {
      "health": "1",
      "flammability": "4",
      "reactivity": "3"
    },
    "limits": {
      "lfl": "",
      "ufl": "",
      "autoIgnitionF": "",
      "lc50": "",
      "idlh": "",
      "tlvTwa": "5",
      "osha": "5"
    },
    "classes": {
      "tgo": "",
      "dot": 2.1
    },
    "cylinderConnections": "",
    "compatibleMaterialText": "SS/Ni（初筛）",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "热处理",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。 常用钢瓶接头缺失，需按地区标准/供应商确认。；材质为工程初筛：参照 SiH4/GeH4 的现有 AP Tech 记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "参照 SiH4/GeH4 的现有 AP Tech 记录"
  },
  {
    "id": "nitric-oxide",
    "index": "41",
    "cnName": "一氧化氮",
    "enName": "Nitric Oxide",
    "formula": "NO",
    "cas": "10102-43-9",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "400",
      "bar": 27.58,
      "mpa": 2.758
    },
    "molarMass": 30.006,
    "n2Factor": 1.035,
    "fromN2Factor": 0.966,
    "airSpecificGravity": 1.036,
    "msdsSummary": "氧化性、高毒",
    "hazards": {
      "health": "3",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "115",
      "idlh": "100",
      "tlvTwa": "25",
      "osha": "25"
    },
    "classes": {
      "tgo": "I",
      "dot": 2.3
    },
    "cylinderConnections": "DISS712, CGA326",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "热处理",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "nitrogen",
    "index": "42",
    "cnName": "氮气",
    "enName": "Nitrogen",
    "formula": "N2",
    "cas": "7727-37-9",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "2640",
      "bar": 182.02,
      "mpa": 18.202
    },
    "molarMass": 28.014,
    "n2Factor": "1",
    "fromN2Factor": "1",
    "airSpecificGravity": 0.967,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "DISS718, CGA580, G5/8\"",
    "compatibleMaterialText": "SS/Ni/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "Ni",
      "VESPEL"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "verified",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质，并说明具备该介质的测试能力；实际应用仍须结合温度、压力、纯度及动态循环确认。"
    }
  },
  {
    "id": "nitrogen-trifluoride",
    "index": "43",
    "cnName": "三氟化氮",
    "enName": "Nitrogen Trifluoride",
    "formula": "NF3",
    "cas": "7783-54-2",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "1450",
      "bar": 99.97,
      "mpa": 9.997
    },
    "molarMass": 71.001,
    "n2Factor": 1.592,
    "fromN2Factor": 0.628,
    "airSpecificGravity": 2.46,
    "msdsSummary": "氧化性、低毒",
    "hazards": {
      "health": "2",
      "flammability": "0",
      "reactivity": "1"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "6700",
      "idlh": "2000",
      "tlvTwa": "10",
      "osha": "10"
    },
    "classes": {
      "tgo": "III",
      "dot": 2.2
    },
    "cylinderConnections": "CGA640",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "湿式洗涤；热处理",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "nitrous-oxide",
    "index": "44",
    "cnName": "笑气",
    "enName": "Nitrous Oxide",
    "formula": "N2O",
    "cas": "10024-97-2",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 736.621,
      "bar": 50.79,
      "mpa": 5.079
    },
    "molarMass": 44.013,
    "n2Factor": 1.254,
    "fromN2Factor": 0.798,
    "airSpecificGravity": 1.53,
    "msdsSummary": "氧化性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "50",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "DISS712, CGA580",
    "compatibleMaterialText": "SS/Ni/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "Ni",
      "VESPEL"
    ],
    "processes": "",
    "exhaustTreatment": "湿式洗涤",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "verified",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质。资料说明除 N2、He 和洁净干燥空气外主要依据外部推荐，且公开数据有限；实际工况仍须由气体及设备供应商确认。"
    }
  },
  {
    "id": "oxygen",
    "index": "45",
    "cnName": "氧气",
    "enName": "Oxygen",
    "formula": "O2",
    "cas": "7782-44-7",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "2640",
      "bar": 182.02,
      "mpa": 18.202
    },
    "molarMass": 31.998,
    "n2Factor": 1.069,
    "fromN2Factor": 0.936,
    "airSpecificGravity": 1.105,
    "msdsSummary": "氧化性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "DISS714, CGA740, G5/8\"",
    "compatibleMaterialText": "SS/Ni/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "Ni",
      "VESPEL"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "verified",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质。资料说明除 N2、He 和洁净干燥空气外主要依据外部推荐，且公开数据有限；实际工况仍须由气体及设备供应商确认。"
    }
  },
  {
    "id": "p-10-mix-10-ch4-in-ar",
    "index": "46",
    "cnName": "P-10混合气（10%甲烷/氩气）",
    "enName": "P-10 mix (10%CH4 in Ar)",
    "formula": "10%CH4/Ar",
    "cas": "-",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "2640",
      "bar": 182.02,
      "mpa": 18.202
    },
    "molarMass": 37.559,
    "n2Factor": 1.158,
    "fromN2Factor": 0.864,
    "airSpecificGravity": 1.25,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "",
    "compatibleMaterialText": "SS/Ni（初筛）",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。 常用钢瓶接头缺失，需按地区标准/供应商确认。；材质为工程初筛：混合组分 CH4 与 Ar 均为 SS/Ni 记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "混合组分 CH4 与 Ar 均为 SS/Ni 记录"
  },
  {
    "id": "phosphine",
    "index": "47",
    "cnName": "磷烷",
    "enName": "Phosphine",
    "formula": "PH3",
    "cas": "7803-51-2",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 478.514,
      "bar": 32.99,
      "mpa": 3.299
    },
    "molarMass": 33.998,
    "n2Factor": 1.102,
    "fromN2Factor": 0.908,
    "airSpecificGravity": 1.17,
    "msdsSummary": "高毒、可燃、自燃",
    "hazards": {
      "health": "4",
      "flammability": "4",
      "reactivity": "2"
    },
    "limits": {
      "lfl": 0.016,
      "ufl": 0.98,
      "autoIgnitionF": "104",
      "lc50": "20",
      "idlh": "200",
      "tlvTwa": 0.3,
      "osha": 0.3
    },
    "classes": {
      "tgo": "I",
      "dot": 2.3
    },
    "cylinderConnections": "DISS632, CGA350",
    "compatibleMaterialText": "SS/Ni/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "Ni",
      "VESPEL"
    ],
    "processes": "掺杂(Dopant)",
    "exhaustTreatment": "干式吸附；热处理",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "verified",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质。资料说明除 N2、He 和洁净干燥空气外主要依据外部推荐，且公开数据有限；实际工况仍须由气体及设备供应商确认。"
    }
  },
  {
    "id": "phosphorous-pentafluoride",
    "index": "48",
    "cnName": "五氟化磷",
    "enName": "Phosphorous Pentafluoride",
    "formula": "PF5",
    "cas": "7647-19-0",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": "400",
      "bar": 27.58,
      "mpa": 2.758
    },
    "molarMass": 125.97,
    "n2Factor": 2.121,
    "fromN2Factor": 0.472,
    "airSpecificGravity": 4.31,
    "msdsSummary": "氧化性、腐蚀性、有毒",
    "hazards": {
      "health": "4",
      "flammability": "0",
      "reactivity": "2"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "260",
      "idlh": "NL",
      "tlvTwa": "3",
      "osha": "6"
    },
    "classes": {
      "tgo": "I",
      "dot": 2.2
    },
    "cylinderConnections": "DiSS642 CGA330,CGA660",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "热处理",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "silane",
    "index": "49",
    "cnName": "硅烷",
    "enName": "Silane",
    "formula": "SiH4",
    "cas": "7803-62-5",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "1260",
      "bar": 86.87,
      "mpa": 8.687
    },
    "molarMass": 32.118,
    "n2Factor": 1.071,
    "fromN2Factor": 0.934,
    "airSpecificGravity": 1.11,
    "msdsSummary": "可燃、自燃",
    "hazards": {
      "health": "2",
      "flammability": "4",
      "reactivity": "3"
    },
    "limits": {
      "lfl": 0.014,
      "ufl": 0.97,
      "autoIgnitionF": "-58",
      "lc50": "19k",
      "idlh": "",
      "tlvTwa": "5",
      "osha": "5"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.1
    },
    "cylinderConnections": "DISS632, CGA350",
    "compatibleMaterialText": "SS/Ni/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "Ni",
      "VESPEL"
    ],
    "processes": "LPCVD；LPCVD介质；PECVD",
    "exhaustTreatment": "硅烷排放",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "verified",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质。资料说明除 N2、He 和洁净干燥空气外主要依据外部推荐，且公开数据有限；实际工况仍须由气体及设备供应商确认。"
    }
  },
  {
    "id": "silicon-tetrachloride",
    "index": "50",
    "cnName": "四氯化硅",
    "enName": "Silicon Tetrachloride",
    "formula": "SiCl4",
    "cas": "10026-04-7",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": -10.66,
      "bar": -0.73,
      "mpa": -0.073
    },
    "molarMass": 169.898,
    "n2Factor": 2.463,
    "fromN2Factor": 0.406,
    "airSpecificGravity": 5.889,
    "msdsSummary": "腐蚀性、有毒、遇水反应",
    "hazards": {
      "health": "3",
      "flammability": "0",
      "reactivity": "2"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "750",
      "idlh": "100",
      "tlvTwa": "5",
      "osha": "5"
    },
    "classes": {
      "tgo": "II",
      "dot": "8"
    },
    "cylinderConnections": "DISS636,JIS-22",
    "compatibleMaterialText": "Ni/H",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "外延(Epitaxy)",
    "exhaustTreatment": "湿式洗涤",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "silicon-tetrafluoride",
    "index": "51",
    "cnName": "四氟化硅",
    "enName": "Silicon Tetrafluoride",
    "formula": "SiF4",
    "cas": "7783-61-1",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "1000",
      "bar": 68.95,
      "mpa": 6.895
    },
    "molarMass": 104.078,
    "n2Factor": 1.928,
    "fromN2Factor": 0.519,
    "airSpecificGravity": 4.67,
    "msdsSummary": "腐蚀性、有毒、遇水反应",
    "hazards": {
      "health": "3",
      "flammability": "0",
      "reactivity": "2"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "450",
      "idlh": "30",
      "tlvTwa": "-",
      "osha": "3"
    },
    "classes": {
      "tgo": "II",
      "dot": 2.3
    },
    "cylinderConnections": "DiSS642 CGA330",
    "compatibleMaterialText": "Ni/H",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "LPCVD钨",
    "exhaustTreatment": "湿式洗涤",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "sulfur-dioxide",
    "index": "52",
    "cnName": "二氧化硫",
    "enName": "Sulfur Dioxide",
    "formula": "SO2",
    "cas": "7446-09-5",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 34.561,
      "bar": 2.38,
      "mpa": 0.238
    },
    "molarMass": 64.058,
    "n2Factor": 1.512,
    "fromN2Factor": 0.661,
    "airSpecificGravity": 2.249,
    "msdsSummary": "腐蚀性、有毒",
    "hazards": {
      "health": "3",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "2520",
      "idlh": "100",
      "tlvTwa": "2",
      "osha": "5"
    },
    "classes": {
      "tgo": "II",
      "dot": 2.3
    },
    "cylinderConnections": "CGA660",
    "compatibleMaterialText": "SS/Ni（初筛）",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "湿式洗涤",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。；材质为工程初筛：干燥 UHP 工况初筛，含水腐蚀风险需单独复核；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "干燥 UHP 工况初筛，含水腐蚀风险需单独复核"
  },
  {
    "id": "sulfur-hexafluoride",
    "index": "53",
    "cnName": "六氟化硫",
    "enName": "Sulfur Hexafluoride",
    "formula": "SF6",
    "cas": "2551-62-4",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 295.493,
      "bar": 20.37,
      "mpa": 2.037
    },
    "molarMass": 146.048,
    "n2Factor": 2.283,
    "fromN2Factor": 0.438,
    "airSpecificGravity": 5.11,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "1",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "1000",
      "osha": "1000"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "DISS716, CGA326",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "湿式洗涤",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "suva-134a",
    "index": "54",
    "cnName": "四氟乙烷",
    "enName": "SUVA-134a",
    "formula": "C2H2F4",
    "cas": "811-97-2",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": "81",
      "bar": 5.58,
      "mpa": 0.558
    },
    "molarMass": 102.03,
    "n2Factor": 1.909,
    "fromN2Factor": 0.524,
    "airSpecificGravity": 3.6,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "1",
      "flammability": "0",
      "reactivity": "1"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "1370",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "1000"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "",
    "compatibleMaterialText": "SS/Ni（初筛）",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。 常用钢瓶接头缺失，需按地区标准/供应商确认。；材质为工程初筛：参照现有氟代烃/制冷剂记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "参照现有氟代烃/制冷剂记录"
  },
  {
    "id": "teos-tetraethyl-orthosilicate",
    "index": "55",
    "cnName": "正硅酸乙酯",
    "enName": "TEOS [Tetraethyl orthosilicate]",
    "formula": "(C2H5O)4Si",
    "cas": "78-10-4",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": "-14",
      "bar": -0.97,
      "mpa": -0.097
    },
    "molarMass": 208.37,
    "n2Factor": 2.727,
    "fromN2Factor": 0.367,
    "airSpecificGravity": 7.223,
    "msdsSummary": "未标注特殊危害/按SDS确认",
    "hazards": {
      "health": "2",
      "flammability": "2",
      "reactivity": "1"
    },
    "limits": {
      "lfl": 0.009,
      "ufl": 0.058,
      "autoIgnitionF": "500",
      "lc50": "",
      "idlh": "",
      "tlvTwa": "10",
      "osha": "-"
    },
    "classes": {
      "tgo": "",
      "dot": ""
    },
    "cylinderConnections": "",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "热处理",
    "notes": "常用钢瓶接头缺失，需按地区标准/供应商确认。",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "tmb-trimethyl-boron",
    "index": "56",
    "cnName": "三甲基硼",
    "enName": "TMB [Trimethyl boron]",
    "formula": "B(CH3)3",
    "cas": "593-90-8",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": "45",
      "bar": 3.1,
      "mpa": 0.31
    },
    "molarMass": 55.92,
    "n2Factor": 1.413,
    "fromN2Factor": 0.708,
    "airSpecificGravity": 2.3,
    "msdsSummary": "腐蚀性、高毒、可燃、自燃、遇水反应",
    "hazards": {
      "health": "4",
      "flammability": "4",
      "reactivity": "3"
    },
    "limits": {
      "lfl": "",
      "ufl": "",
      "autoIgnitionF": "130",
      "lc50": "",
      "idlh": "",
      "tlvTwa": "7",
      "osha": ""
    },
    "classes": {
      "tgo": "",
      "dot": 2.3
    },
    "cylinderConnections": "",
    "compatibleMaterialText": "SS/Ni",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "",
    "exhaustTreatment": "干式吸附；热处理",
    "notes": "常用钢瓶接头缺失，需按地区标准/供应商确认。",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "trichlorosilane",
    "index": "57",
    "cnName": "TCS/ 三氯氢硅",
    "enName": "Trichlorosilane",
    "formula": "SiHCl3",
    "cas": "10025-78-2",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": -5.2,
      "bar": -0.36,
      "mpa": -0.036
    },
    "molarMass": 135.5,
    "n2Factor": 2.199,
    "fromN2Factor": 0.455,
    "airSpecificGravity": 4.67,
    "msdsSummary": "腐蚀性、有毒、可燃、遇水反应",
    "hazards": {
      "health": "3",
      "flammability": "4",
      "reactivity": "2"
    },
    "limits": {
      "lfl": 0.07,
      "ufl": 0.83,
      "autoIgnitionF": "360",
      "lc50": "1040",
      "idlh": "-",
      "tlvTwa": "5",
      "osha": "-"
    },
    "classes": {
      "tgo": "",
      "dot": 4.3
    },
    "cylinderConnections": "VCR",
    "compatibleMaterialText": "Ni/H",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "外延(Epitaxy)",
    "exhaustTreatment": "湿式洗涤；热处理",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "tungsten-hexafluoride",
    "index": "58",
    "cnName": "六氟化钨",
    "enName": "Tungsten Hexafluoride",
    "formula": "WF6",
    "cas": "7783-82-6",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": 2.444,
      "bar": 0.17,
      "mpa": 0.017
    },
    "molarMass": 297.838,
    "n2Factor": 3.261,
    "fromN2Factor": 0.307,
    "airSpecificGravity": 10.674,
    "msdsSummary": "腐蚀性、有毒",
    "hazards": {
      "health": "4",
      "flammability": "0",
      "reactivity": "2"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "217",
      "idlh": "30",
      "tlvTwa": "3",
      "osha": "3"
    },
    "classes": {
      "tgo": "II",
      "dot": 2.3
    },
    "cylinderConnections": "DISS638, CGA670",
    "compatibleMaterialText": "Ni/H",
    "compatibleMaterials": [
      "Ni",
      "H"
    ],
    "processes": "LPCVD钨",
    "exhaustTreatment": "湿式洗涤",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf",
    "compatibilityConfidence": "verified"
  },
  {
    "id": "xenon",
    "index": "59",
    "cnName": "氙气",
    "enName": "Xenon",
    "formula": "Xe",
    "cas": "7440-63-3",
    "state": "G",
    "stateNote": "Compressed Gas / 压缩气体",
    "cylinderPressure": {
      "psig": "645",
      "bar": 44.47,
      "mpa": 4.447
    },
    "molarMass": 131.3,
    "n2Factor": 2.165,
    "fromN2Factor": 0.462,
    "airSpecificGravity": 4.558,
    "msdsSummary": "惰性",
    "hazards": {
      "health": "0",
      "flammability": "0",
      "reactivity": "0"
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "-",
      "idlh": "-",
      "tlvTwa": "-",
      "osha": "-"
    },
    "classes": {
      "tgo": "-",
      "dot": 2.2
    },
    "cylinderConnections": "CGA580",
    "compatibleMaterialText": "SS/Ni/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "Ni",
      "VESPEL"
    ],
    "processes": "",
    "exhaustTreatment": "直排",
    "notes": "",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "verified",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质。资料说明除 N2、He 和洁净干燥空气外主要依据外部推荐，且公开数据有限；实际工况仍须由气体及设备供应商确认。"
    }
  },
  {
    "id": "f-125",
    "index": "60",
    "cnName": "五氟乙烷",
    "enName": "F-125",
    "formula": "C2HF5",
    "cas": "354-33-6",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": "175",
      "bar": 12.07,
      "mpa": 1.207
    },
    "molarMass": 120.02,
    "n2Factor": 2.07,
    "fromN2Factor": 0.483,
    "airSpecificGravity": 4.143,
    "msdsSummary": "非易燃液化气；受热容器可能爆炸；高温分解可产生HF等有害产物",
    "hazards": {
      "health": "",
      "flammability": 0,
      "reactivity": ""
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "",
      "idlh": "",
      "tlvTwa": "",
      "osha": ""
    },
    "classes": {
      "tgo": "",
      "dot": 2.2
    },
    "cylinderConnections": "CGA580",
    "compatibleMaterialText": "SS/Ni（初筛）",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "等离子刻蚀；制冷/清洁灭火介质",
    "exhaustTreatment": "回收或受控排放；高温工况需考虑含氟分解产物洗涤",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。；材质为工程初筛：参照现有氟代烃记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；PubChem https://pubchem.ncbi.nlm.nih.gov/compound/9633",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "参照现有氟代烃记录"
  },
  {
    "id": "hexafluorobutadiene",
    "index": "61",
    "cnName": "六氟丁二烯",
    "enName": "Hexafluorobutadiene",
    "formula": "C4F6",
    "cas": "685-63-2",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": "10",
      "bar": 0.69,
      "mpa": 0.069
    },
    "molarMass": 162.03,
    "n2Factor": 2.405,
    "fromN2Factor": 0.416,
    "airSpecificGravity": 5.593,
    "msdsSummary": "极易燃气体；吸入有毒；高压气体",
    "hazards": {
      "health": 3,
      "flammability": 4,
      "reactivity": ""
    },
    "limits": {
      "lfl": "",
      "ufl": "",
      "autoIgnitionF": "",
      "lc50": "",
      "idlh": "",
      "tlvTwa": "",
      "osha": ""
    },
    "classes": {
      "tgo": "",
      "dot": ""
    },
    "cylinderConnections": "DISS724",
    "compatibleMaterialText": "SS/Ni（初筛）",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "先进介质层/低k材料等离子刻蚀",
    "exhaustTreatment": "燃烧或等离子分解后湿式洗涤；配置毒性与可燃气体监测",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。；材质为工程初筛：参照现有全氟烃记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；PubChem https://pubchem.ncbi.nlm.nih.gov/compound/69636",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "参照现有全氟烃记录"
  },
  {
    "id": "ethylene",
    "index": "62",
    "cnName": "乙烯",
    "enName": "Ethylene",
    "formula": "C2H4",
    "cas": "74-85-1",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": "692",
      "bar": 47.71,
      "mpa": 4.771
    },
    "molarMass": 28.05,
    "n2Factor": 1.001,
    "fromN2Factor": 0.999,
    "airSpecificGravity": 0.968,
    "msdsSummary": "极易燃气体；可致嗜睡或眩晕；高浓度有窒息风险",
    "hazards": {
      "health": 2,
      "flammability": 4,
      "reactivity": 2
    },
    "limits": {
      "lfl": 0.0275,
      "ufl": 0.286,
      "autoIgnitionF": 842,
      "lc50": "",
      "idlh": "",
      "tlvTwa": "",
      "osha": ""
    },
    "classes": {
      "tgo": "",
      "dot": 2.1
    },
    "cylinderConnections": "W21.8-14L",
    "compatibleMaterialText": "SS/Ni（初筛）/Vespel SP-1",
    "compatibleMaterials": [
      "SS",
      "Ni",
      "VESPEL"
    ],
    "processes": "CVD/ALD碳源；材料改性与研究工艺",
    "exhaustTreatment": "热氧化/燃烧处理；配置可燃气体监测",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。；材质为工程初筛：烃类 UHP 工况初筛；PubChem 明确提示避免铜；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；PubChem https://pubchem.ncbi.nlm.nih.gov/compound/6325；AP Tech PN-453 Polyimide Seat Material Compatibility.pdf",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "烃类 UHP 工况初筛；PubChem 明确提示避免铜",
    "sourceBackedCompatibleMaterials": [
      "VESPEL"
    ],
    "materialCompatibilityNotes": {
      "VESPEL": "AP Tech PN-453 将该气体列为 DuPont Vespel SP-1 聚酰亚胺兼容介质。资料说明除 N2、He 和洁净干燥空气外主要依据外部推荐，且公开数据有限；实际工况仍须由气体及设备供应商确认。"
    }
  },
  {
    "id": "octafluorocyclopentene",
    "index": "63",
    "cnName": "八氟环戊烯",
    "enName": "Octafluorocyclopentene",
    "formula": "C5F8",
    "cas": "559-40-0",
    "state": "L",
    "stateNote": "Liquefied Gas / 液化气",
    "cylinderPressure": {
      "psig": -9.6,
      "bar": -0.66,
      "mpa": -0.066
    },
    "molarMass": 212.04,
    "n2Factor": 2.751,
    "fromN2Factor": 0.364,
    "airSpecificGravity": 7.319,
    "msdsSummary": "吸入有毒；刺激皮肤、眼睛和呼吸道",
    "hazards": {
      "health": 3,
      "flammability": "",
      "reactivity": ""
    },
    "limits": {
      "lfl": "",
      "ufl": "",
      "autoIgnitionF": "",
      "lc50": "",
      "idlh": "",
      "tlvTwa": "",
      "osha": ""
    },
    "classes": {
      "tgo": "",
      "dot": ""
    },
    "cylinderConnections": "DISS716",
    "compatibleMaterialText": "SS/Ni（初筛）",
    "compatibleMaterials": [
      "SS",
      "Ni"
    ],
    "processes": "先进介质层/低k材料等离子刻蚀",
    "exhaustTreatment": "等离子或燃烧分解后湿式洗涤；配置毒性气体监测",
    "notes": "兼容材质未在Mott表中直接列出，需按供应商SDS/兼容性表复核。；材质为工程初筛：参照现有全氟烃记录；需供应商逐项确认",
    "source": "气体属性表.xlsx；UHP钢瓶压力.pdf；UHP气体兼容性指南.pdf；PubChem https://pubchem.ncbi.nlm.nih.gov/compound/11212",
    "compatibilityConfidence": "provisional",
    "compatibilityBasis": "参照现有全氟烃记录"
  },
  {
    "id": "tma-trimethylaluminum",
    "index": "64",
    "cnName": "TMA / 三甲基铝",
    "enName": "Trimethylaluminum",
    "formula": "Al(CH3)3",
    "cas": "75-24-1",
    "state": "L",
    "stateNote": "Low-vapor-pressure pyrophoric liquid precursor / 低蒸气压自燃液体前驱体",
    "cylinderPressure": {
      "psig": "",
      "bar": "",
      "mpa": ""
    },
    "pressureText": "普通气瓶压力不适用；20°C 蒸气压约 12.4 mmHg(abs) / 0.0165 bar(abs)",
    "molarMass": 72.09,
    "n2Factor": 1.604,
    "fromN2Factor": 0.623,
    "airSpecificGravity": 2.489,
    "msdsSummary": "自燃液体；遇空气可自燃；遇水剧烈反应并释放可自燃气体；造成严重皮肤灼伤和眼损伤",
    "hazards": {
      "health": 3,
      "flammability": 4,
      "reactivity": 3
    },
    "limits": {
      "lfl": "-",
      "ufl": "-",
      "autoIgnitionF": "-",
      "lc50": "未建立",
      "idlh": "未建立",
      "tlvTwa": "未建立",
      "osha": "未建立"
    },
    "classes": {
      "tgo": "-",
      "dot": "常见4.2/4.3；须按供应商SDS确认"
    },
    "cylinderConnections": "供应商专用源瓶/安瓿；常见金属面密封接口，须按源瓶图纸确认",
    "compatibleMaterialText": "316L SS；PCTFE 有条件；Vespel 慎用/需确认",
    "compatibleMaterials": [
      "SS"
    ],
    "conditionalMaterials": [
      "PCTFE"
    ],
    "conditionalMaterialNotes": {
      "PCTFE": "有条件兼容：限严格无水、受控温度的静态密封/阀座工况；未找到 TMA 专项公开兼容表，必须由设备供应商确认"
    },
    "restrictedMaterials": [
      "VESPEL"
    ],
    "restrictedMaterialNotes": {
      "VESPEL": "慎用：Vespel 牌号差异大，聚酰亚胺含极性官能团且可能吸湿；无 TMA 专项确认时不建议作为默认接液密封"
    },
    "processes": "ALD/CVD沉积Al2O3；AlN及含铝薄膜；MOVPE/MOCVD含铝化合物半导体",
    "exhaustTreatment": "先惰性稀释并受控氧化/燃烧，再进入经验证的干式吸附或洗涤系统；严禁液态TMA直接接触水",
    "notes": "采用惰性气体密闭输送，系统必须严格除水除氧。泄漏或火灾处置按供应商SDS执行，禁用水和泡沫；材料结论仅作初筛。",
    "source": "PubChem https://pubchem.ncbi.nlm.nih.gov/compound/16682925；PubChem PUG-View（物性/GHS）；TMA/聚合物相互作用研究 https://arxiv.org/abs/2009.08344",
    "compatibilityConfidence": "mixed",
    "compatibilityBasis": "316L为常用金属接液材质；PCTFE基于氟聚合物耐化学性作有条件初筛；Vespel因牌号、吸湿和聚酰亚胺官能团风险需专项确认"
  }
]

module.exports = { materialOptions, msdsGases }
