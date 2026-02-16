# Task: gen-heap-kth_largest-7699 | Score: 100% | 2026-02-15T11:13:21.395459

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()