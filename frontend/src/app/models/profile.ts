export interface Profile {
    _id?: string;
    profileId?: string;
    // Step 1: Basic Details
    fullName: string;
    gender: string;
    dateOfBirth: string;
    height: string;
    motherTongue: string;
    maritalStatus: string;

    // Step 2: Religious & Cultural
    religion: string;
    caste: string;
    gothra?: string;
    manglik: string;
    visitDarghaFateha?: string;
    complexion?: string;

    // Step 3: Location Details
    country: string;
    state: string;
    district: string;
    city: string;
    locality?: string;
    pinCode?: string;
    nativePlace?: string;

    // Step 4: Education & Career
    highestEducation: string;
    degree?: string;
    occupation: string;
    company?: string;
    monthlyIncome?: string;

    // Step 5: Family Details
    fatherStatus: string;
    motherStatus: string;
    fatherName?: string;
    fatherOccupation?: string;
    motherName?: string;
    motherOccupation?: string;
    siblings: string;
    familyType: string;
    familyValues: string;

    // Step 6: Lifestyle & Interests
    diet: string;
    smoking: string;
    drinking: string;
    hobbies: string[];
    bio: string;

    // Step 7: Media & Contact
    profilePhotoUrl?: string;
    verificationDocUrl?: string;
    membershipTier?: string;
    email?: string;
    contactNo?: string;
    alternateNo?: string;

    // Phase 5: Partner Preferences
    partnerPreferences?: {
        ageRange?: { min?: number; max?: number };
        heightRange?: { min?: string; max?: string };
        maritalStatus?: string[];
        religion?: string[];
        motherTongue?: string[];
        diet?: string[];
        country?: string[];
        state?: string[];
        city?: string;
        complexion?: string[];
        annualIncome?: string;
    };

    // Phase 6: Profile Deactivation
    isActive?: boolean;
}

export const STATES_DISTRICTS: { [key: string]: string[] } = {
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
