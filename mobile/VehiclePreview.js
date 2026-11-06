import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { referenceCrop, vehicleReference as vehicle } from './vehicle-reference.mjs';

export default function VehiclePreview({base}) {
  return <View style={styles.content}>
    <Text style={styles.notice}>Design preview · GoBid reference from Sandton</Text>
    <Text style={styles.label}>LOT {vehicle.lot} · {vehicle.condition.toUpperCase()}</Text>
    <Text accessibilityRole="header" style={styles.title}>{vehicle.title}</Text>
    <Text style={styles.body}>{vehicle.issuer} · {vehicle.location}</Text>
    <View style={styles.crop}>
      <Image source={{uri:base + '/vehicle-preview/photo'}} resizeMode="stretch"
        accessibilityLabel="Silver Ford Figo with front-left damage" style={styles.photo} />
    </View>
    <View style={styles.panel}>
      <Text style={styles.label}>Amount shown on the notice</Text>
      <Text style={styles.title}>{vehicle.amount}</Text>
      <Text style={styles.body}>{vehicle.event} · {vehicle.schedule}</Text>
      <Text style={styles.body}>Date and time as printed by the issuer</Text>
      <Text accessibilityRole="button" accessibilityState={{disabled:true}} style={styles.disabled}>Bid with issuer · Preview only</Text>
    </View>
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.heading}>Lot details</Text>
      {vehicle.specs.map(([label,value]) => <View key={label} style={styles.row}>
        <Text style={styles.body}>{label}</Text><Text style={styles.value}>{value}</Text>
      </View>)}
    </View>
    <View style={styles.panel}><Text accessibilityRole="header" style={styles.heading}>Condition overview</Text><Text style={styles.body}>{vehicle.note}</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  content:{gap:10},
  title:{color:'#133b33',fontSize:30,fontWeight:'800'},
  heading:{color:'#133b33',fontSize:18,fontWeight:'800'},
  label:{color:'#356b54',fontSize:12,fontWeight:'800'},
  body:{color:'#425e53',lineHeight:21},
  value:{color:'#133b33',fontWeight:'700'},
  notice:{color:'#204b3b',backgroundColor:'#e3eedf',borderRadius:8,padding:10},
  crop:{aspectRatio:referenceCrop.aspectRatio,width:'100%',backgroundColor:'#deebe0',borderRadius:12,overflow:'hidden'},
  photo:{position:'absolute',width:referenceCrop.width,height:referenceCrop.height,left:referenceCrop.left,top:referenceCrop.top},
  panel:{backgroundColor:'#fff',borderColor:'#d7e2dc',borderWidth:1,borderRadius:12,padding:13,gap:8},
  disabled:{backgroundColor:'#e8efea',borderRadius:8,padding:10,color:'#425e53',fontWeight:'700'},
  row:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:8,borderTopWidth:1,borderTopColor:'#d7e2dc',paddingTop:7},
});

