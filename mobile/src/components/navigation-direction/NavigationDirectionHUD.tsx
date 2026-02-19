import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ManeuverTypeApi } from '../../type';
import BottomDrawer from '../BottomDrawer';
import {Step} from "../../api/outdoorDirectionsApi";

const BURGUNDY = '#800020';
const BURGUNDY_DARK = '#5a0016';

function getManeuverIcon(maneuver: ManeuverTypeApi): keyof typeof Ionicons.glyphMap {
    switch (maneuver) {
        case 'TURN_RIGHT':
        case 'RAMP_RIGHT':
        case 'FORK_RIGHT':       return 'arrow-forward';
        case 'TURN_LEFT':
        case 'RAMP_LEFT':
        case 'FORK_LEFT':        return 'arrow-back';
        case 'TURN_SLIGHT_RIGHT':
        case 'KEEP_RIGHT':       return 'chevron-forward';
        case 'TURN_SLIGHT_LEFT':
        case 'KEEP_LEFT':        return 'chevron-back';
        case 'TURN_SHARP_RIGHT': return 'return-up-forward';
        case 'TURN_SHARP_LEFT':  return 'return-up-back';
        case 'UTURN_RIGHT':      return 'return-down-forward';
        case 'UTURN_LEFT':       return 'return-down-back';
        case 'ROUNDABOUT_RIGHT':
        case 'ROUNDABOUT_LEFT':  return 'refresh-outline';
        case 'MERGE':            return 'git-merge-outline';
        case 'FERRY':            return 'boat-outline';
        case 'FERRY_TRAIN':      return 'train-outline';
        default:                 return 'arrow-up';
    }
}

function StepRow({ step }: { step: Step }) {
    return (
        <View style={stepStyles.row}>
            <View style={stepStyles.iconWrap}>
                <Ionicons name={getManeuverIcon(step.maneuverType)} size={18} color="#fff" />
            </View>
            <View style={stepStyles.text}>
                <Text style={stepStyles.instruction} numberOfLines={2}>{step.instruction}</Text>
                <Text style={stepStyles.meta}>{step.distance}</Text>
            </View>
        </View>
    );
}

const stepStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.2)',
        gap: 12,
    },
    iconWrap: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: BURGUNDY_DARK,
        alignItems: 'center', justifyContent: 'center',
    },
    text: { flex: 1 },
    instruction: { color: '#fff', fontSize: 14, fontWeight: '500', lineHeight: 19 },
    meta: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
});

export interface NavigationDirectionHudProps {
    visible: boolean;
    steps: Step[];
    onClose: () => void;
}

export default function NavigationDirectionHud({ visible, steps, onClose }: NavigationDirectionHudProps) {
    const [expanded, setExpanded] = useState(false);

    if (!steps || steps.length === 0) return null;

    const [nextStep, ...remainingSteps] = steps;

    return (
        <BottomDrawer
            visible={visible}
            onClose={onClose}
            snapPoints={['30%', '60%']}
            initialSnapIndex={0}
            enablePanDownToClose={false}
            backgroundColor={BURGUNDY}        // ← red background
            handleColor="rgba(255,255,255,0.4)"
            contentContainerStyle={styles.drawerContent}
        >
            {/* Primary next-step card */}
            <View style={styles.primaryCard}>
                <View style={styles.primaryIconWrap}>
                    <Ionicons name={getManeuverIcon(nextStep.maneuverType)} size={36} color="#fff" />
                </View>
                <View style={styles.primaryText}>
                    <Text style={styles.primaryInstruction} numberOfLines={2}>
                        {nextStep.instruction}
                    </Text>
                    <Text style={styles.primaryDistance}>{nextStep.distance}</Text>
                </View>
            </View>

            {/* Collapsible remaining steps */}
            {remainingSteps.length > 0 && (
                <Pressable onPress={() => setExpanded((v) => !v)} style={styles.expandToggle}>
                    <Text style={styles.expandLabel}>
                        {expanded ? 'Hide steps' : `${remainingSteps.length} more steps`}
                    </Text>
                    <Ionicons
                        name={expanded ? 'chevron-down' : 'chevron-up'}
                        size={16}
                        color="rgba(255,255,255,0.7)"
                    />
                </Pressable>
            )}

            {expanded && (
                <ScrollView style={styles.stepList} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {remainingSteps.map((step, i) => (
                        <StepRow key={i} step={step} />
                    ))}
                </ScrollView>
            )}
        </BottomDrawer>
    );
}

const styles = StyleSheet.create({
    drawerContent: {
        paddingHorizontal: 4,
        paddingTop: 0,
        alignItems: 'stretch',
    },
    primaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 12,
    },
    primaryIconWrap: {
        width: 64, height: 64, borderRadius: 16,
        backgroundColor: BURGUNDY_DARK,
        alignItems: 'center', justifyContent: 'center',
    },
    primaryText: { flex: 1 },
    primaryInstruction: {
        color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 26,
    },
    primaryDistance: {
        color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4, fontWeight: '500',
    },
    expandToggle: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, gap: 6,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    expandLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },
    stepList: { maxHeight: 220 },
});