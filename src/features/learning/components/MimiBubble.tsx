import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "../../../web/dom";


type Props = {
  text: string;
};


export default function MimiBubble({
  text,
}: Props) {


  return (

    <View style={styles.container}>


      <View style={styles.bubble}>

        <Text style={styles.text}>
          {text}
        </Text>


      </View>


      <View style={styles.arrow}/>


    </View>

  );
}



const styles = StyleSheet.create({

container:{
alignItems:"center",
},


bubble:{
backgroundColor:"#FFF3BF",
paddingHorizontal:20,
paddingVertical:14,
borderRadius:22,
borderWidth:2,
borderColor:"#FFB000",
maxWidth:320,
},


text:{
fontSize:18,
fontWeight:"800",
textAlign:"center",
color:"#333",
lineHeight:28,
},


arrow:{
width:0,
height:0,
borderLeftWidth:12,
borderRightWidth:12,
borderTopWidth:14,
borderLeftColor:"transparent",
borderRightColor:"transparent",
borderTopColor:"#FFB000",
},


});
