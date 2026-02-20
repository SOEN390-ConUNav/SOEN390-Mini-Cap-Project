import { View, Text,StyleSheet, Button, Pressable } from 'react-native'
import React from 'react'
import BottomDrawer from '../BottomDrawer';
import useNavigationInfo from '../../hooks/useNavigationInfo';

interface NavigationInfoBottomProps {
    readonly visible:boolean;
    readonly onClose: () => void;
    readonly onPressAction?: () => void;
}

const NavigationInfoBottom = ({visible, onClose, onPressAction}:NavigationInfoBottomProps) => {
  const distance = useNavigationInfo((state) => state.pathDistance);
  const duration = useNavigationInfo((state) => state.pathDuration);
  const getETA = (durationInput: string) => {
    if (!durationInput || durationInput === 'N/A') return '--:--';
    let totalMinutes = 0;
    const now = new Date();
    

    const toks = durationInput.toLowerCase().split(/\s+/);
    for (let i = 0; i < toks.length; i++) {
      const value = Number.parseInt(toks[i], 10);
      if (!Number.isNaN(value)) {
        const nextToken = toks[i + 1] || '';
        if (nextToken.includes('hour')) {
          totalMinutes += value * 60;
        } else if (nextToken.includes('min')) {
          totalMinutes += value;
        }
      }
    }

    if (totalMinutes === 0) return '--:--';

    now.setMinutes(
      now.getHours() * 60 + now.getMinutes() + totalMinutes
    );

    return now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false,});
  };
  return (
    <BottomDrawer 
    visible={visible}
    onClose={onClose}
    snapPoints={['5%', '25%']}
    enablePanDownToClose={false}
    onPressMinimize={true}
    enableDynamicSizing={false}
    initialSnapIndex={1}
    onPressAction={onPressAction}
    >
    
    <View >
      <Text style={styles.smallText}>Estimated Time Arrival</Text>
      <Text style={styles.bigText}>{getETA(duration)}</Text>
      <Text style={styles.smallText}>Distance</Text>
      <Text style={styles.bigText}>{distance}</Text>
    </View>
    </BottomDrawer>
    
  )
}

export default NavigationInfoBottom

const styles = StyleSheet.create({
    smallText:{
        color: "#800020",
        textAlign: "center"
    },
    bigText:{
        color: "#800020",
        fontWeight: "bold",
        fontSize: 50,
        textAlign: "center"
    }
});
