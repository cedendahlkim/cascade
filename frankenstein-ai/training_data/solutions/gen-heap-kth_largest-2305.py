# Task: gen-heap-kth_largest-2305 | Score: 100% | 2026-02-14T13:12:06.238766

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()