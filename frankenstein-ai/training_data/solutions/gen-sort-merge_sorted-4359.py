# Task: gen-sort-merge_sorted-4359 | Score: 100% | 2026-02-12T19:50:51.515538

def merge_sorted_lists():
    n1 = int(input())
    list1 = []
    for _ in range(n1):
        list1.append(int(input()))
    
    n2 = int(input())
    list2 = []
    for _ in range(n2):
        list2.append(int(input()))
    
    merged_list = sorted(list1 + list2)
    print(*merged_list)

merge_sorted_lists()