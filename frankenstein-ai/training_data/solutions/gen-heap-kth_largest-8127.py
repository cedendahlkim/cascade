# Task: gen-heap-kth_largest-8127 | Score: 100% | 2026-02-14T12:05:18.043045

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()