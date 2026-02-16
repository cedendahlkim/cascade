# Task: gen-heap-kth_largest-3805 | Score: 100% | 2026-02-13T21:48:27.332452

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()