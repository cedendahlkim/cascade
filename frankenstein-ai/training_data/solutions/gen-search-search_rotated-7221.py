# Task: gen-search-search_rotated-7221 | Score: 100% | 2026-02-12T15:34:56.720498

def search_rotated_sorted_array():
    n = int(input())
    arr = list(map(int, input().split()))
    target = int(input())

    try:
        print(arr.index(target))
    except ValueError:
        print(-1)

search_rotated_sorted_array()