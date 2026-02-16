# Task: gen-heap-kth_largest-9064 | Score: 100% | 2026-02-15T13:31:08.601597

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()