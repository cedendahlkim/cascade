# Task: gen-sort-merge_sorted-6497 | Score: 100% | 2026-02-12T19:17:00.924860

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