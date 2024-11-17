import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { getAllNodes, getNodeById } from './api';
import { createNode, createRelationship } from './components/Node';

console.log('main.js loaded');

// Количество отображаемых узлов
const NODE_LIMIT = 10;

// Инициализация сцены
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
console.log('Camera position:', camera.position);

const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Добавление управления камерой
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
console.log('Camera target:', controls.target);

// Установка камеры 
camera.position.z = 20;

// Обработка изменения размера окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Функция для создания случайных координат для узлов
const generateRandomPosition = () => {
    return {
        x: Math.random() * 100 - 50, 
        y: Math.random() * 100 - 50,
        z: Math.random() * 100 - 50
    };
};


// Функция для назначения цвета узлу
const getNodeColor = (label) => {
    console.log('Node label:', label);
    if (label === 'User') {
        return 0x0000ff; // Синий для "User"
    } else if (label === 'Group') {
        return 0x00ff00; // Зеленый для "Group"
    }
    return 0xffffff; // Если не "User" и не "Group", то белый по умолчанию
};

// Функция для назначения цвета связи
const getRelationshipColor = (relationshipType) => {
    console.log('Relationship type:', relationshipType);
    if (relationshipType === 'Follow') {
        return 0x0000ff; // Синий для "Follower"
    } else if (relationshipType === 'Subscribe') {
        return 0x00ff00; // Зеленый для "Subscription"
    }
    return 0xff0000; // Ярко-красный для всех остальных типов
};

// Метод для получения дополнительной информации по каждому узлу
const getNodeDetails = async (nodeId) => {
    console.log('getNodeDetails with nodeId:', nodeId);
    try {
        const nodeDetails = await getNodeById(nodeId);
        console.log(`nodeDetails with ${nodeId}:`, nodeDetails);

        if (nodeDetails) {
            return nodeDetails;
        } else {
            console.error(`Node with id ${nodeId} has no details or node data.`);
            return null;
        }

    } catch (error) {
        console.error(`Error fetching details for node ${nodeId}:`, error);
        return null;
    }
};

// getAllNodes().then((nodes) => {
//     console.log('Loaded nodes:', nodes); // Отладка
//     const limitedNodes = nodes.slice(0, NODE_LIMIT); // Ограничиваем количество узлов
//     console.log('Limited nodes:', limitedNodes); // Проверяем ограниченные данные

//     const objects = [];
//     limitedNodes.forEach(async (node) => {
//         // Для каждого узла генерируем случайные координаты
//         const position = generateRandomPosition();

//         // Присваиваем цвет в зависимости от label узла
//         const color = getNodeColor(node.label);

//         // Создаем узел
//         const nodeMesh = createNode(position, color, node.attributes);
//         console.log('Node created:', nodeMesh);

//         // Добавляем узел в сцену
//         scene.add(nodeMesh);
//         objects.push(nodeMesh);
//     });

//     // Устанавливаем центр масс как цель камеры
//     const center = calculateCenterOfMass(objects);
//     controls.target.set(center.x, center.y, center.z);
// });

// Получаем список всех узлов
getAllNodes().then(async (nodes) => {
    console.log('Loaded nodes:', nodes); // Отладка

    // Ограничиваем количество узлов для обработки
    const limitedNodes = nodes.slice(0, NODE_LIMIT);
    console.log('Limited nodes:', limitedNodes);

    const objects = []; // Для хранения узлов на сцене
    const positionsMap = new Map(); // Для хранения позиций узлов по их id

    // Обработка каждого узла из ограниченного списка
    for (const node of limitedNodes) {
        const nodeDetails = await getNodeDetails(node.id);
        if (!nodeDetails) {
            console.log(`Skipping node with id ${node.id} due to missing details.`);
            continue;
        }

        // Генерируем случайные координаты для текущего узла
        const position = generateRandomPosition();
        positionsMap.set(node.id, position); // Сохраняем позицию узла для связи

        // Присваиваем цвет в зависимости от label узла
        const color = getNodeColor(node.label);

        // Создаем и добавляем узел в сцену
        const nodeMesh = createNode(position, color, nodeDetails[0].node.attributes);
        scene.add(nodeMesh);
        objects.push(nodeMesh);

        // Обрабатываем связи для текущего узла
        nodeDetails.forEach((detail) => {
            const targetNodeId = detail.target_node.attributes.id; // ID целевого узла

            // Проверяем, есть ли целевой узел в ограниченном списке
            const targetNode = limitedNodes.find((n) => n.id === targetNodeId);
            if (!targetNode) {
                console.log(`Target node with id ${targetNodeId} is not in the limited list. Skipping connection.`);
                return;
            }

            // Проверяем, есть ли координаты целевого узла
            const targetPosition = positionsMap.get(targetNodeId);
            if (!targetPosition) {
                console.log(`No position for target node ${targetNodeId}. Skipping connection.`);
                return;
            }

            // Получаем цвет связи
            const relationshipColor = getRelationshipColor(detail.relationship.type);

            // Создаем линию связи между узлами
            const line = createRelationship(position, targetPosition, relationshipColor);
            scene.add(line);
        });
    }

    // Устанавливаем центр масс как цель камеры
    const center = calculateCenterOfMass(objects);
    controls.target.set(center.x, center.y, center.z);
});


// Центр масс
const calculateCenterOfMass = (nodes) => {
    const center = { x: 0, y: 0, z: 0 };
    nodes.forEach(node => {
        center.x += node.position.x;
        center.y += node.position.y;
        center.z += node.position.z;
    });
    center.x /= nodes.length;
    center.y /= nodes.length;
    center.z /= nodes.length;
    return center;
};

// Анимация
const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
};
animate();
