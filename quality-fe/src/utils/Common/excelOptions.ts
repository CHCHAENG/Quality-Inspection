import type { ExcelOptions, InspectionType } from "../../types/common";

type ColWchByField = ExcelOptions["widthOptions"]["colWchByField"];

export function excelOptions(
  inspectionType: InspectionType,
  effectiveKind: string
): ExcelOptions {
  // 1) approvalWch
  const approvalWch: [number, number, number, number] = (() => {
    if (inspectionType === "mtr") {
      if (effectiveKind === "st") return [9.2, 9.7, 9.7, 9.7];
      if (effectiveKind === "pvc") return [6.2, 9.8, 9.8, 9.8];
      if (effectiveKind === "scr") return [9.2, 9.2, 9.2, 8.2];
    }

    if (inspectionType === "prcs") {
      if (effectiveKind === "st") return [7.8, 8.2, 8.2, 8.2];
      if (effectiveKind === "dr") return [10.1, 11.2, 11.2, 11.2];
    }

    if (inspectionType === "initFinal") {
      if (effectiveKind === "wx") return [9.7, 9.7, 9.7, 9.7];
      if (effectiveKind === "whex") return [10.7, 10.7, 10.7, 10.7];
      if (effectiveKind === "whbs") return [8.5, 8.5, 8.5, 8.5];
    }

    if (inspectionType === "final") {
      if (effectiveKind === "wx") return [8.2, 8.2, 8.2, 8.2];
      if (effectiveKind === "we") return [5.8, 10.7, 10.7, 10.7];
    }

    return [10, 10, 10, 10];
  })();

  // 2) heightOptions
  const heightOptions: ExcelOptions["heightOptions"] = (() => {
    const base = { headerHpt: 25, bodyHpt: 25 };

    if (inspectionType === "mtr") {
      if (effectiveKind === "st") return { headerHpt: 24.9, bodyHpt: 24.9 };
      if (effectiveKind === "pvc") return { headerHpt: 24.9, bodyHpt: 24.9 };
      if (effectiveKind === "scr") return { headerHpt: 72, bodyHpt: 24.9 };
    }

    if (inspectionType === "prcs") {
      if (effectiveKind === "st") return { headerHpt: 24.9, bodyHpt: 24.9 };
      if (effectiveKind === "dr") return { headerHpt: 36, bodyHpt: 24.9 };
    }

    if (inspectionType === "initFinal") {
      if (effectiveKind === "wx") return { headerHpt: 24.9, bodyHpt: 24.9 };
      if (effectiveKind === "whex") return { headerHpt: 30.8, bodyHpt: 22.5 };
      if (effectiveKind === "whbs") return { headerHpt: 38.3, bodyHpt: 22.5 };
    }

    if (inspectionType === "final") {
      if (effectiveKind === "we") return { headerHpt: 24.9, bodyHpt: 24.9 };
      if (effectiveKind === "wx") return { headerHpt: 22.5, bodyHpt: 22.5 };
    }

    return base;
  })();

  // 3) colWchByField (✅ InspGridPage 내용 전부 반영)
  const colWchByField: ColWchByField = {};

  if (inspectionType === "mtr") {
    if (effectiveKind === "st") {
      Object.assign(colWchByField, {
        no: 6.1,
        vendor: 19.1,
        barcode: 32.1,
        itemCode: 14.1,
        appearnce: 5.1,
        packing: 5.1,
        strandCount: 6.1,
        outerDiameter: 8.1,
        pitch: 5.1,
        cond1: 8.1,
      });
    } else if (effectiveKind === "pvc") {
      Object.assign(colWchByField, {
        no: 5.1,
        vendor: 17.1,
        itemName: 20.1,
        itemColor: 5.1,
        barcode: 18.1,
      });
    } else if (effectiveKind === "scr") {
      Object.assign(colWchByField, {
        no: 5.1,
        vendor: 19.1,
        barcode: 18.1,
        packing: 6.8,
        appearance: 6.8,
        cond1: 8.1,
      });
    }
  } else if (inspectionType === "prcs") {
    if (effectiveKind === "st") {
      Object.assign(colWchByField, {
        no: 3.5,
        itemCode: 8.8,
        lotNo: 14.7,
        appearance: 6.1,
        strandCount: 6.1,
        outerDiameter: 8.2,
        cond1: 7.8,
        cond2: 7.8,
      });
    } else if (effectiveKind === "dr") {
      Object.assign(colWchByField, {
        no: 3.5,
        itemCode: 8.7,
        lotNo: 15.2,
        appearance: 4.6,
        strandCount: 5.1,
        cond1: 10.1,
      });
    }
  } else if (inspectionType === "initFinal") {
    if (effectiveKind === "wx") {
      Object.assign(colWchByField, {
        no: 6.1,
        itemName: 8.1,
        std: 7.1,
        p_color: 6.1,
        lotNo: 16.1,
        appearance: 4.6,
        color: 4.6,
        label: 4.6,
        packing: 4.6,
        printing: 4.6,
        insulationOD1: 9.7,
        insulationOD2: 9.7,
        souterDiameter: 8.3,
        cond1: 7.8,
        cond2: 7.8,
        cond3: 7.8,
        cond4: 7.8,
        eccentricity_wx: 6.1,
      });
    } else if (effectiveKind === "whex") {
      Object.assign(colWchByField, {
        no: 3.5,
        itemName: 8.5,
        std: 4.6,
        p_color: 4.6,
        lotNo: 14.5,
        insulationOD1: 7.6,
        insulationOD2: 7.6,
        oDiameter1: 7.6,
        oDiameter2: 7.6,
        oDiameter3: 7.6,
        oDiameter4: 6.5,
        shezThk1: 6.5,
        shezThk2: 6.5,
        shezThk3: 6.5,
        shezThk4: 6.5,
        s_cond1: 8.7,
        s_cond2: 8.7,
      });
    } else if (effectiveKind === "whbs") {
      Object.assign(colWchByField, {
        no: 5.1,
        itemName: 6.8,
        std: 4.6,
        p_color: 4.6,
        lotNo: 14.5,
        subStrandCnt: 6.5,
        insulationOD1: 7.1,
        insulationOD2: 7.1,
        insulationOD3: 7.1,
        insulationOD4: 7.1,
        souterDiameter: 7.1,
        cond1: 7.1,
        cond2: 7.1,
        cond3: 7.1,
        cond4: 7.1,
        avg_insulThk: 7.1,
        insulThk1: 7.1,
        insulThk2: 7.1,
        insulThk3: 7.1,
        insulThk4: 7.1,
        insulThk5: 7.1,
      });
    }
  } else if (inspectionType === "final") {
    if (effectiveKind === "we") {
      Object.assign(colWchByField, {
        no: 5.1,
        itemName: 7.7,
        std: 4.6,
        p_color: 4.6,
        lotNo: 16.1,
        appearance: 6.1,
        color: 6.1,
        label: 6.1,
        packing: 6.1,
        printing: 6.1,
        subStrandCnt: 6.1,
        insulationOD1: 8.3,
        insulationOD2: 8.3,
        souterDiameter: 8.3,
        cond1: 7.8,
        cond2: 7.8,
        cond3: 7.8,
        cond4: 7.8,
        eccentricity: 6.1,
      });
    } else if (effectiveKind === "wx") {
      Object.assign(colWchByField, {
        no: 5.1,
        itemName: 10.2,
        std: 4.6,
        p_color: 4.6,
        lotNo: 17.7,
        appearance: 4.6,
        color: 4.6,
        label: 4.6,
        packing: 4.6,
        printing: 4.6,
        subStrandCnt: 6.5,
        insulationOD1: 9.7,
        insulationOD2: 9.7,
        souterDiameter: 8.3,
        cond1: 7.8,
        cond2: 7.8,
        cond3: 7.8,
      });
    }
  }

  return {
    widthOptions: {
      approvalWch,
      colWchByField,
    },
    heightOptions,
  };
}
