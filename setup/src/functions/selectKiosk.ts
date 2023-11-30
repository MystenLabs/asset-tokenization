import { QueringKiosks } from "./queringKiosk";
import { CreateNewPersonalKiosk } from "./createNewPersonalKiosk";
import { ConvertKioskToPersonal } from "./convertKioskToPersonal";
import { QueringTargetContent } from "./queringKioskContent";

export async function ForcePersonalKiosk() {
    const [personalKiosks, nonPersonalKiosks] = await QueringKiosks();

    const num_of_personal = personalKiosks.length;
    const num_of_non_personal = nonPersonalKiosks.length;

    const num_of_kiosks = num_of_personal + num_of_non_personal;
    console.log("Num of Kiosks", num_of_kiosks)

    if (num_of_kiosks == 0){
      const targetKiosk = await CreateNewPersonalKiosk();
      console.log("Create personal kiosk", targetKiosk);
      return targetKiosk;
    };

    if (num_of_personal == 1){
      const targetKiosk = personalKiosks[0].kioskId;
      console.log("Use existing personal kiosk", targetKiosk);
      return targetKiosk;
    }
    else if (num_of_personal > 1) {
      let count = 0;
      while (count < num_of_personal) {
        let KioskID = personalKiosks[count].kioskId;
        const targetKiosk = await QueringTargetContent(KioskID);
        if (targetKiosk !== undefined){
          console.log("Use the corresponding kiosk", targetKiosk);
          return targetKiosk;
        }
        count = count + 1;
      }
      
      const targetKiosk = personalKiosks[0].kioskId;
      console.log("Select one from personal kiosks", targetKiosk);
      return targetKiosk;
    }

    const targetKiosk = nonPersonalKiosks[0].kioskId;
    await ConvertKioskToPersonal(targetKiosk);
    console.log("Convert kiosk to personal", targetKiosk);
    return targetKiosk;
}