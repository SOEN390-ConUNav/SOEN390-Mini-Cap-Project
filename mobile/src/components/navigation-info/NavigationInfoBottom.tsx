import { View, Text,StyleSheet } from 'react-native'
import React from 'react'
import BottomDrawer from '../BottomDrawer';
import useNavigationInfo from '../../hooks/useNavigationInfo';

interface NavigationInfoBottomProps {
    visible:boolean;
    onClose: () => void;
}

const NavigationInfoBottom = ({visible, onClose}:NavigationInfoBottomProps) => {
  const pathDistance = useNavigationInfo((state) => state.pathDistance);
  const pathDuration = useNavigationInfo((state) => state.pathDuration);
  const calculateETA = (durationStr: string) => {
    if (!durationStr || durationStr === 'N/A') return '--:--';

    const now = new Date();
    let totalMinutes = 0;

    const tokens = durationStr.toLowerCase().split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
      const val = Number.parseInt(tokens[i], 10);
      if (!Number.isNaN(val)) {
        const nextToken = tokens[i + 1] || '';
        if (nextToken.includes('hour')) {
          totalMinutes += val * 60;
        } else if (nextToken.includes('min')) {
          totalMinutes += val;
        }
      }
    }

    if (totalMinutes === 0) return '--:--';

    now.setMinutes(now.getHours() * 60 + now.getMinutes() + totalMinutes);

    return now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };
  return (
    <BottomDrawer 
    visible={visible}
    onClose={onClose}
    snapPoints={['25']}>
    <View >
      <Text style={styles.smallText}>Estimated Time Arrival</Text>
      <Text style={styles.bigText}>{calculateETA(pathDuration)}</Text>
      <Text style={styles.smallText}>Distance</Text>
      <Text style={styles.bigText}>{pathDistance}</Text>
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
