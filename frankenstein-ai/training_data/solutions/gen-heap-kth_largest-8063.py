# Task: gen-heap-kth_largest-8063 | Score: 100% | 2026-02-14T12:36:35.846376

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()