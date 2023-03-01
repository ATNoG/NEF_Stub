from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, AnyHttpUrl, constr, Extra
from .commonData import UsageThreshold

#Common Data Types

class TimeWindow(BaseModel):
    """Represents a time window identified by a start time and a stop time."""
    startTime: datetime = Field(None, description="Identifies the start time.")
    stopTime: datetime = Field(None, description="Identifies the stop time.")

class LocationArea(BaseModel):
    """Represents a user location area."""
    cellIds: List[str] = Field(None, description="Indicates a list of Cell Global Identities of the user which identifies the cell the UE is registered.", min_items=1)
    enodeBIds: List[str] = Field(None, description="Indicates a list of eNodeB identities in which the UE is currently located.", min_items=1)
    routingAreaIds: List[str] = Field(None, description="Identifies a list of Routing Area Identities of the user where the UE is located.", min_items=1)
    trackingAreaIds: List[str] = Field(None, description=" Identifies a list of Tracking Area Identities of the user where the UE is located.", min_items=1)
    #TODO: TS 29.572 Nlmf_Location -- Complex
    # geographicAreas: List[GeographicArea] = Field(None, description="Identifies a list of geographic area of the user where the UE is located.", min_items=1)
    # civicAddresses: List[CivicAddress] = Field(None, description="Identifies a list of civic addresses of the user where the UE is located.", min_items=1)
    pass

class LocationArea5G(BaseModel):
    """Represents a user location area when the UE is attached to 5G."""
    # geographicAreas: List[GeographicArea] = Field(None, description="Identifies a list of geographic area of the user where the UE is located.", min_items=0)
    # civicAddresses: List[CivicAddress] = Field(None, description="Identifies a list of civic addresses of the user where the UE is located.", min_items=0)
    #TODO: TS 29.554 Npcf_BDTPolicyControl
    # nwAreaInfo: NetworkAreaInfo =
    pass

#-------------

#Specific Data Types

class TransferPolicy(BaseModel):
    """Represents an offered transfer policy sent from the SCEF to the SCS/AS, or a 
    selected transfer policy sent from the SCS/AS to the SCEF."""
    bdtPolicyId: int = Field(None, description="Identifier for the transfer policy.")
    maxUplinkBandwidth: Optional[int] =  Field(None, description="Bandwidth in bits per second.", ge=0)
    maxDownlinkBandwidth: Optional[int] =  Field(None, description="Bandwidth in bits per second.", ge=0)
    ratingGroup: int = Field(None, description="Indicates the rating group during the time window.", ge=0)
    timeWindow: TimeWindow = None

class BdtCreate(BaseModel):
    """Represents a Background Data Transfer subscription."""
    #TODO: TS 29.571 Common Data
    #supportedFeatures: Optional[SupportedFeatures] = None
    volumePerUE: UsageThreshold
    numberOfUEs: int = Field(description="Identifies the number of UEs.", ge=1)
    desiredTimeWindow: TimeWindow
    #locationArea: Optional[LocationArea] = None
    #locationArea5G: Optional[LocationArea5G] = None
    referenceId: Optional[str] = Field(None, description="string identifying a BDT Reference ID as defined in clause 5.3.3 of 3GPP TS 29.154.")
    #TODO: transferPolicies need to be readOnly
    transferPolicies: List[TransferPolicy] = Field(None, description="Identifies an offered transfer policy.", min_items=1)
    selectedPolicy: Optional[int] = Field(None, description="Identity of the selected background data transfer policy. Shall not be present in initial message exchange, can be provided by NF service consumer in a subsequent message exchange.")
    #TODO: ExternalGroupId could be done with regex maybe. Following what was already done
    externalGroupId: Optional[str] = Field("Group1@domain.com", description="Identifies a group made up of one or more subscriptions associated to a group of IMSIs, containing a Domain Identifier and a Local Identifier. \<Local Identifier\>@\<Domain Identifier\>")
    notificationDestination: Optional[AnyHttpUrl] = Field("http://localhost:80/api/v1/utils/bdt/callback", description="Reference resource (URL) identifying service consumer's endpoint, in order to receive the asynchronous notification. For testing use 'http://localhost:80/api/v1/utils/bdt/callback'") #Default value for development testing
    warnNotifEnabled: Optional[bool] = Field(None, description="Indicates whether the BDT warning notification is enabled (true) or not (false). Default value is false.")
    trafficDes: Optional[str] = Field(None, description="Identify a traffic descriptor as defined in Figure 5.2.2 of 3GPP TS 24.526, octets v+5 to w.")

    class Config:
        extra = Extra.forbid

class Bdt(BdtCreate):
    """Represents a Background Data Transfer subscription."""
    link: Optional[AnyHttpUrl] = Field("https://myresource.com", description="String identifying a referenced resource. This is also returned as a location header in 201 Created Response")
    class Config:
            orm_mode = True

class BdtPatch(BaseModel):
    """Represents a Background Data Transfer subscription modification request."""
    selectedPolicy: int = Field(None, description="Identity of the selected background data transfer policy.")
    warnNotifEnabled: Optional[bool] = Field(None, description="Indicates whether the BDT warning notification is enabled (true) or not (false).")
    notificationDestination: Optional[AnyHttpUrl] = Field("http://localhost:80/api/v1/utils/bdt/callback", description="Reference resource (URL) identifying service consumer's endpoint, in order to receive the asynchronous notification. For testing use 'http://localhost:80/api/v1/utils/bdt/callback'") #Default value for development testing

class ExNotification(BaseModel):
    """Represents a Background Data Transfer notification."""
    bdtRefId: str = Field(None, description="string identifying a BDT Reference ID as defined in clause 5.3.3 of 3GPP TS 29.154.")
    # locationArea5G: Optional[LocationArea5G] = None
    timeWindow: Optional[TimeWindow] = None
    candPolicies: Optional[List[TransferPolicy]] = Field(None, description="This IE indicates a list of the candidate transfer policies from which the AF may select a new transfer policy due to network performance degradation. ", min_items=1)