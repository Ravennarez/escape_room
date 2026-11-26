"use client";

import { useState } from "react";
import type { ItemId } from "@/game/model";
import { BrassKeyIcon } from "@/components/BrassKeyIcon";
import styles from "./Inventory.module.css";
import { getItemName } from "@/game/rules";

interface InventoryProps {
  items: readonly ItemId[];
  selectedItem: ItemId | null;
  onSelectItem: (item: ItemId) => void;
}

export function Inventory({
  items,
  selectedItem,
  onSelectItem,
}: InventoryProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`${styles.inventory} ${isCollapsed ? styles.collapsed : ""}`}
      aria-labelledby="inventory-title"
    >
      <div className={styles.heading}>
        <h2 id="inventory-title">Inventory <span>{items.length.toString().padStart(2, "0")}</span></h2>
        <button
          className={styles.toggleButton}
          type="button"
          aria-label={isCollapsed ? "Show inventory" : "Hide inventory"}
          aria-expanded={!isCollapsed}
          aria-controls="inventory-content"
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={isCollapsed ? "m7 14 5-5 5 5" : "m7 10 5 5 5-5"} />
          </svg>
        </button>
      </div>

      <div className={styles.inventoryContent} id="inventory-content">
        {items.length === 0 ? (
          <div className={styles.emptyInventory}>
            <p className={styles.empty}>
              Tap a room object to uncover items.
            </p>
            <div className={styles.emptySlots} aria-hidden="true">
              {Array.from({ length: 3 }, (_, index) => (
                <span key={index} />
              ))}
            </div>
          </div>
        ) : (
          <ul className={styles.itemList}>
            {items.map((item) => {
              const name = getItemName(item);
              const isSelected = selectedItem === item;

              return (
                <li key={item}>
                  <button
                    type="button"
                    className={`${styles.item} ${isSelected ? styles.active : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => onSelectItem(item)}
                  >
                    <span className={styles.itemIcon}>
                      <BrassKeyIcon />
                    </span>
                    <span className={styles.itemText}>
                      <span className={styles.itemName}>{name}</span>
                    </span>
                  </button>
                </li>
              );
            })}
            {Array.from({ length: Math.max(0, 3 - items.length) }, (_, index) => (
              <li key={`empty-${index}`} aria-hidden="true">
                <span className={styles.emptyItemSlot} />
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <p className={styles.useNote}>
            {selectedItem
              ? `Selected: ${getItemName(selectedItem)}. Click an object to use it.`
              : "Select an item, then click an object."}
          </p>
        )}
      </div>
    </aside>
  );
}
