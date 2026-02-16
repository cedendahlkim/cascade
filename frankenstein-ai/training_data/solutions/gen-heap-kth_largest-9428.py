# Task: gen-heap-kth_largest-9428 | Score: 100% | 2026-02-13T20:02:07.504194

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()