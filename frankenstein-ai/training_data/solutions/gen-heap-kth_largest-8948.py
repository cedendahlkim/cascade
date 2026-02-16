# Task: gen-heap-kth_largest-8948 | Score: 100% | 2026-02-13T19:24:36.175158

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()