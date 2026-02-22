
// Dropdown toggle function
document.getElementById("userButton").addEventListener("click", function(event) {
    event.preventDefault();  // Prevent default link action
    var content = document.getElementById("dropdownContent");
    content.classList.toggle("show");  // Toggle the 'show' class
});

// Hide dropdown when clicking outside
window.addEventListener("click", function(event) {
    if (!event.target.closest('.dropdown')) {
        var dropdownContent = document.getElementById("dropdownContent");
        dropdownContent.classList.remove("show");  // Remove the 'show' class
    }
});

// State and District section
const stateDropdown  = document.getElementById("state");
const districtDropdown = document.getElementById("district")


const districtsData = {
    "AP": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Nellore", "Srikakulam", "Visakhapatnam", "West Godavari", "YSR Kadapa"],
    "AR": ["Tawang", "West Kameng", "East Kameng", "Papum Pare", "Lower Subansiri", "Upper Subansiri", "Kurung Kumey", "Kra Daadi", "Shi Yomi", "Lepa Rada", "West Siang", "East Siang", "Upper Siang", "Anjaw", "Changlang", "Lohit", "Namsai", "Tirap", "Longding"],
    "AS": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Diphu", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
    "BR": ["Araria", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Gaya", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali"],
    "CT": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bilaspur", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa", "Jashpur", "Kabirdham", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surguja"],
    "GO": ["North Goa", "South Goa"],
    "GJ": ["Ahmedabad", "Amreli", "Anand", "Banaskantha", "Bharuch", "Bhavnagar", "Dang", "Gandhinagar", "Jamnagar", "Junagadh", "Kutch", "Mahisagar", "Mehsana", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Surat", "Tapi", "Vadodara", "Valsad"],
    "HR": ["Ambala", "Bhiwani", "Faridabad", "Fatehabad", "Gurgaon", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Mahendragarh", "Mewat", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
    "HP": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
    "JK": ["Jammu", "Kathua", "Poonch", "Rajouri", "Samba", "Udhampur", "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kishtwar", "Kulgam", "Pulwama", "Ramban", "Reasi", "Srinagar", "Shopian"],
    "JH": ["Bokaro", "Chatra", "Deoghar", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Kodarma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ranchi", "Sahibganj", "Seraikela-Kharsawan", "West Singhbhum"],
    "KA": ["Bagalkot", "Bangalore Rural", "Bangalore Urban", "Belgaum", "Bellary", "Bidar", "Chamarajanagar", "Chikballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davangere", "Dharwad", "Gadag", "Gulbarga", "Hassan", "Haveri", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysore", "Raichur", "Ramanagara", "Shimoga", "Tumkur", "Udupi", "Uttara Kannada", "Yadgir"],
    "KL": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kottayam", "Kollam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thrissur", "Wayanad"],
    "MP": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Hoshangabad", "Jabalpur", "Jagdalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Vidisha"],
    "MH": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
    "MN": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kangpokpi", "Noney", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
    "ME": ["East Garo Hills", "East Khasi Hills", "North Garo Hills", "Ri-Bhoi", "South Garo Hills", "West Garo Hills", "West Khasi Hills"],
    "MI": ["Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Mamit", "Saiha", "Serchhip"],
    "NL": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Phek", "Tuensang", "Wokha", "Zunheboto"],
    "OD": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Dhenkanal", "Ganjam", "Gajapati", "Jajpur", "Jagatsinghpur", "Jajpur", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khurda", "Koraput", "Malkangiri", "Nabarangpur", "Nayagarh", "Nuapada", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
    "PB": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fatehgarh", "Ferozepur", "Jalandhar", "Kapurthala", "Mansa", "Moga", "Mohali", "Muktsar", "Nawanshahr", "Patiala", "Ropar", "SBS Nagar", "Tarn Taran"],
    "RJ": ["Ajmer", "Aligarh", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Nagaur", "Pali", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Tonk", "Udaipur"],
    "SK": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
    "TN": ["Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam", "Namakkal", "Perambalur", "Pudukkottai", "Ramanathapuram", "Salem", "Sivaganga", "Thanjavur", "Theni", "Tiruchirapalli", "Tirunelveli", "Tirupur", "Vellore", "Viluppuram", "Virudhunagar"],
    "TS": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal", "Nagarkurnool", "Nalgonda", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Ranga Reddy", "Siddipet", "Wanaparthy", "Warangal (Rural)", "Warangal (Urban)", "Yadadri Bhuvanagiri"],
    "TR": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
    "UP": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Badaun", "Bagpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Faizabad", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddh Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur", "Kasganj", "Kaushambi", "Kheri", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Raebareli", "Rampur", "Saharanpur", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shrawasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
    "UT": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
    "WB": ["Bankura", "Bardhaman", "Birbhum", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Purba Bardhaman", "Purulia", "South 24 Parganas", "West Bardhaman", "West Midnapore"],
    "AN": ["Andaman", "Nicobar"],
    "CH": ["Chandigarh"],
    "DN": ["Dadra and Nagar Haveli", "Daman", "Diu"],
    "LD": ["Lakshadweep"],
    "PY": ["Karaikal", "Mahe", "Puducherry", "Yanam"]
};

// Function to update districts based on selected state
function updateDistricts() {
    const stateDropdown = document.getElementById("state");
    const districtDropdown = document.getElementById("district");

    // Clear existing options in the district dropdown
    districtDropdown.innerHTML = '<option value="">Select District</option>';

    // Get selected state value
    const selectedState = stateDropdown.value;

    // Check if the selected state has districts
    if (districtsData[selectedState]) {
        // Loop through districts and add them to the dropdown
        districtsData[selectedState].forEach(district => {
            const option = document.createElement("option");
            option.value = district;
            option.textContent = district;
            districtDropdown.appendChild(option);
        });
    }
}

// Add event listener to the state dropdown
document.getElementById("state").addEventListener("change", updateDistricts);



// Membership //
document.querySelectorAll('.subscribe-btn').forEach(button => {
    button.addEventListener('click', function() {
        alert('You have selected the ' + this.closest('.plan').querySelector('h2').innerText + ' plan!');
        // Add your subscription logic here
    });
});

// profile image and crop function //
let cropper;
let rotation = 0;

document.getElementById('upload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('preview');
            img.src = e.target.result;
            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(img, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 1,
                responsive: true,
                background: false,
            });
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('rotate-btn').addEventListener('click', function() {
    if (cropper) {
        rotation = (rotation + 90) % 360;
        cropper.rotateTo(rotation);
    }
});

document.getElementById('crop-btn').addEventListener('click', function() {
    if (cropper) {
        const canvas = cropper.getCroppedCanvas();
        const img = document.getElementById('preview');
        img.src = canvas.toDataURL();
        cropper.destroy();
    }
});

document.getElementById('upload-btn').addEventListener('click', function() {
    alert('Image uploaded successfully!');
});





