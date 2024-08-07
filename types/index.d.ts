type ApiResponse = {
    data: ApiResponseData;
    result: string;
    message: string;
    token?: string;
    status: number;
    links?: any;
    meta?: any;
};

type VotedMember = {
    id: number;
    country: Country;
    member: Company;
};

type Company = {
    id: number;
    voted: boolean;
    name: string;
    email: string;
    wsaId: string;
    countryName: string;
    city: string;
    state: string | null;
    typeCompany: string;
    country: Country;
    imageUrl: string;
    totalVotes: number;
    votingActive: boolean;

    ref: Admin | null;
    detectedCountryName: string | null;
    detectedCountry: string | Country;
    unhashedPassword: string;
    addressLine1: string;
    addressLine2: string | null;
    mapLong: string;
    mapLat: string;
    slogan: string | null;
    postalCode: string | null;
    companyEmail: string;
    phone: string;
    phoneKeyId: number;
    phoneKey: string;
    orders: Order[];
    pendingOrder: Order;
    fax: string;
    faxKeyId: number;
    faxKey: string;
    website: string;
    profile: string | null;
    branches: string | null;
    businessEst: string;
    employeesNum: string;
    refValue: string | null;
    otherCertificates: string | null;
    otherServices: string | null;
    tosAcceptance: true;
    referralId: number;
    countryId: number;
    image: Media;
    contactPersons: ContactPerson[];
    tradeReferences: [];
    services: number[];
    certificates: number[];
    networks: MemberNetwork[];
    currentNetworkStatus: MemberNetwork;
    pendingNetworkStatus: MemberNetwork[];
};

type Order = {
    id: number;
    uuid: string;
    total: number;
    amount: number;
    packageId: number;
    packagePrice: number;
    totalDelegatesPrice: number;
    totalSpousesPrice: number;
    totalPriceSponsorshipItems: number;
    coupon: string | null;
    company: Company;
    package: Package;
    delegates: Delegate[];
    spouses: Spouse[];
    sponsorshipItems: SponsorshipItem[];
    rooms: RoomDetails[];
    status: string;
    updatedAt: string;
    createdAt: string;
};

type Person = {
    id: number;
    name: string;
    type: string;
    title: string;
    jobTitle: string | null;
    userId: number;
    orderId: number;
    imageUrl: string;
};

type RoomDetails = {
    room: Room;
    orderComplete: boolean;
    persons: Person[];
    recordId: number;
    bedType: string;
    roomId: number;
    totalPrice: number;
    startDate: string;
    endDate: string;
    startDateFormatted: string;
    endDateFormatted: string;
    date: string[];
};

type ContactPerson = {
    id: number;
    userId: number;
    title: string;
    name: string;
    email: string;
    birthDate: string | null;
    phone: string;
    phoneKeyId: number;
    phoneKey: string;
    cell: string;
    cellKeyId: number;
    cellKey: string;
    company: Company;
    jobTitle: string;
    imageUrl: string;
    image: Media;
    deleted: boolean;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

type CompanyVoteUpdateBody = {
    id: number;
    votingActive: boolean;
};

type ApiResponseData =
    | Company
    | Company[]
    | Visit
    | Visit[]
    | User
    | User[]
    | Media
    | Media[]
    | PublicSetting
    | PublicSetting[]
    | InfoBoxType
    | InfoBoxType[]
    | City
    | City[]
    | Conference
    | Conference[]
    | Role
    | Role[]
    | Admin
    | Admin[]
    | Network
    | Network[]
    | Country
    | Country[]
    | Resource
    | Resource[]
    | Continent
    | Continent[];

type PublicSetting = {
    id: number;
    name: string;
    value: any;
};

type ConferenceStatisticsBox = {
    totalAmount: number;
    totalApprovedDelegates: number;
    totalBookedRooms: number;
    totalRegisteredCompanies: number;
    totalApprovedCompanies: number;
};
type NetworkStatisticsBox = {
    totalApproved: number;
    totalBlacklisted: number;
    totalSuspended: number;
    totalCountriesWithMembers: number;
};
type PostServerParams = {
    filters: Record<string, string | number | undefined>;
    orderBy: string;
    orderByDirection: string;
    perPage: number;
    paginate: boolean;
    deleted: boolean;
};
type VoteStatisticsApiResponse = {
    totalVoters: number;
    totalCountriesWithMembers: number;
    totalVotes: number;
    totalVotedMembers: number;
};
type InfoBoxType = {
    title: string;
    icon: string;
    value: string | number;
    description?: string | undefined;
};
type MemberInfoBoxType = {
    title: string;
    icon: string;
    value: string | number | boolean;
    description?: string | undefined;
};

type ChartDataValues = {
    label: string;
    data: number[];
};
type Conference = {
    id: number;
    name: string;
    cityId: number;
    countryId: number;
    city: string;
    country: string;
    flag: string;
    venue: string;
    virtual: boolean;
    active: boolean;
    orderId: number;
    earlyBirdActive: boolean;
    earlyBirdEndDate: string;
    regDeadlineDate: string;
    hotelBookingMaxDuration: string[];
    ebMemberDelegatePrice: number;
    ebMemberSpousePrice: number;
    ebNonMemberDelegatePrice: number;
    ebNonMemberSpousePrice: number;
    memberDelegatePrice: number;
    memberSpousePrice: number;
    nonMemberDelegatePrice: number;
    nonMemberSpousePrice: number;
    duration: string[];
    isPast: boolean;
    logoUrl: string;
    logo: Media;
    logoDarkUrl: string;
    logoDark: Media;
    deleted: boolean;
    deletedAt: string | null;
};

type Visit = {
    country: Country;
    count: number;
};
type Media = {
    id: number;
    name: string;
    fileName: string;
    mimeType: string;
    size: number;
    createdAt: string;
    previewUrl: string;
    url: string;
    fullUrl: string;
};
type Continent = {
    id: number;
    name: string;
    active: boolean;
    orderId: number;
    countries: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    deleted: boolean;
};
type Network = {
    id: number;
    name: string;
    slug: string;
    domain: string;
    active: boolean;
    collection: boolean;
    orderId: string;
    imageUrl: string;
    image: Media;
    settings?: NetworkSetting[];
};
type MemberNetwork = {
    id: number;
    networkId?: number;
    name: string;
    slug: string;
    domain: string;
    active: boolean;
    collection: boolean;
    orderId: string;
    imageUrl: string;
    image: Media;
    fpp: boolean;
    network: boolean;
    status: string;
    type: string;
    startDate: string | null;
    expireDate: string | null;
    createdAt: string;
    startDateFormatted: string | null;
    expireDateFormatted: string | null;
    createdAtFormatted: string | null;
    createdSince: string | null;
    expireDaysLeft: string | null;
    expireSoon: boolean;
    expired: boolean;
};
type MemberNetworkForm = {
    networkId: number;
    active: boolean;
    fpp: boolean;
    network: boolean;
    status: string;
    type: string;
    startDate: string | null;
    expireDate: string | null;
};
type Resource = {
    id: number;
    active: boolean;
    name: string;
    slug: string;
    orderId: number;
    createdAt: boolean;
    updatedAt: string;
    deletedAt: string | null;
    deleted: boolean;
}; // For Certificates | Services | Referrals
type Credentials = {
    email: string;
    password: string;
};
type Role = {
    id: number;
    name: string;
    permissions: string[];
};
type Admin = {
    id: number;
    name: string;
    email: string;
    superAdmin: boolean;
    roleId: number | undefined;
    role: Role;
};
type ToastItem = {
    title: string | undefined;
    message: string | undefined;
    type: string | undefined;
    key?: symbol;
    duration: number | undefined;
};

type Country = {
    id: number;
    name: string;
    key: string;
    code: string;
    active: boolean;
    imageUrl: string;
    image: Media;
    orderId: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    deleted: boolean;
};
type City = {
    id: number;
    name: string;
    country: Country;
    orderId: number;
    countryName: string;
    countryId: number;
    lat: string;
    lng: string;
    active: number;
    createdAt: string;
    updatedAt: string;
    deleted: boolean;
    deletedAt: string | null;
};

type SideBarMenu = {
    name: string;
    path: string;
    icon: string;
    permissions: string[];
    subMenus: SideBarMenu[];
};

type NetworkSetting = {
    id: number;
    name: string;
    type: string;
    value: any | null;
};

type Package = {
    id: number;
    name: string;
    price: number;
    delegateCount: number;
    earlybirdPrice: number;
};

type Dietary = {
    id: number;
    name: string;
    slug: string;
    active: boolean;
    orderId: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    deleted: boolean;
};

type BC = {
    id: number;
    name: string;
    mimeType: string;
    size: number;
    authorId: number | null;
    previewUrl: string;
    fullUrl: string;
    createdAt: string;
};

type Delegate = {
    id: number;
    name: string;
    type: string;
    title: string;
    jobTitle: string;
    email: string;
    userId: number;
    tshirtSize: string;
    phone: string;
    cell: string;
    phoneKeyId: number;
    phoneKey: string;
    cellKeyId: number;
    cellKey: string;
    extraDietaries: string | null;
    dietaries: Dietary[];
    imageUrl: string;
    bcUrl: string;
    bc: BC | null;
    orderComplete: boolean;
};

type Spouse = {
    id: number;
    name: string;
    title: string;
    type: string;
    userId: number;
    delegateId: number;
    delegate: string;
    tshirtSizeId: number;
    tshirtSize: string;
    orderId: number;
    extraDietaries: string;
    dietaries: Dietary[];
    imageUrl: string;
    image: Media | null;
    orderComplete: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    deleted: boolean;
};

type SponsorshipItem = {
    id: number;
    name: string;
    price: number;
    description: string;
    earlybirdPrice: number;
    priceUsed: number;
    imageUrl: string;
};
