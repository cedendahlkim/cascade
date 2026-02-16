# Task: gen-heap-kth_largest-1458 | Score: 100% | 2026-02-14T13:11:50.337507

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()