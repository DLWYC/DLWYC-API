function generateUniqueId(selectedArchdeaconry) {
    let archInitials
    const constantLetters = "DLWYC";

    switch(selectedArchdeaconry) {
        case "Abule Egba":
            archInitials = "01"
            break;
        case "Agege":
            archInitials = "02"
            break;
        case "Amuwo Odofin":
            archInitials = "03"
            break;
        case "Bariga":
            archInitials = "04"
            break;
        case "Cathedral":
            archInitials = "05"
            break;
        case "Egbe":
            archInitials = "06"
            break;
        case "Festac":
            archInitials = "07"
            break;
        case "Gowon Estate":
            archInitials = "08"
            break;
        case "Iba":
            archInitials = "09"
            break;
        case "Idimu":
            archInitials = "10"
            break;
        case "Ijede":
            archInitials = "11"
            break;
        case "Iju-Ishaga":
            archInitials = "12"
            break;
        case "Ikeja":
            archInitials = "13"
            break;
        case "Ikorodu":
            archInitials = "14"
            break;
        case "Ikorodu-North":
            archInitials = "15"
            break;
        case "Ikosi-Ketu":
            archInitials = "16"
            break;
        case "Ikotun":
            archInitials = "17"
            break;
        case "Imota":
            archInitials = "18"
            break;
        case "Ipaja":
            archInitials = "19"
            break;
        case "Isolo":
            archInitials = "20"
            break;
        case "Ogudu":
            archInitials = "21"
            break;
        case "Ojo":
            archInitials = "22"
            break;
        case "Ojo-Alaba":
            archInitials = "23"
            break;
        case "Ojodu":
            archInitials = "24"
            break;
        case "Opebi":
            archInitials = "25"
            break;
        case "Oshodi":
            archInitials = "26"
            break;
        case "Oto-Awori":
            archInitials = "27"
            break;
        case "Owutu":
            archInitials = "28"
            break;
        case "Satellite":
            archInitials = "29"
            break;
        case "Somolu":
            archInitials = "30"
            break;
        default:
            archInitials = "00"
    
    
    }  
    // Get the archdeaconry number based on the selected archdeaconry
    const randomLength = 4;
    // // Generate the random part
     const randomPart = Math.floor(Math.random() * Math.pow(10, randomLength)).toString().padStart(randomLength, '0');
  
    // // Format the ID
    const uniqueId = `${constantLetters}/${archInitials}/${randomPart}`;

    
  
    return uniqueId;
  }
  


module.exports = {generateUniqueId}