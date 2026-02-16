# Task: gen-heap-kth_largest-6565 | Score: 100% | 2026-02-15T11:37:53.171490

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()