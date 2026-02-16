# Task: gen-search-search_rotated-7845 | Score: 100% | 2026-02-12T17:09:58.156367

def search_rotated_sorted_array():
    n = int(input())
    arr = list(map(int, input().split()))
    target = int(input())

    for i in range(n):
        if arr[i] == target:
            print(i)
            return

    print(-1)

search_rotated_sorted_array()