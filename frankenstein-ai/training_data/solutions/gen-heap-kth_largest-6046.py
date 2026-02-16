# Task: gen-heap-kth_largest-6046 | Score: 100% | 2026-02-13T19:24:36.650296

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()