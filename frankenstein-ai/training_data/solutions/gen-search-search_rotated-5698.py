# Task: gen-search-search_rotated-5698 | Score: 100% | 2026-02-12T19:29:05.280558

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