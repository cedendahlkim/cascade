# Task: gen-search-search_rotated-5544 | Score: 100% | 2026-02-11T12:16:15.561922

def solve():
    n = int(input())
    arr = list(map(int, input().split()))
    target = int(input())

    try:
        print(arr.index(target))
    except ValueError:
        print(-1)

solve()