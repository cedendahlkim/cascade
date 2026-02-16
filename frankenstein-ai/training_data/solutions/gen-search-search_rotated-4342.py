# Task: gen-search-search_rotated-4342 | Score: 100% | 2026-02-12T12:23:17.182256

def search_rotated_sorted_array():
    n = int(input())
    nums = list(map(int, input().split()))
    target = int(input())

    for i in range(n):
        if nums[i] == target:
            print(i)
            return

    print(-1)

search_rotated_sorted_array()