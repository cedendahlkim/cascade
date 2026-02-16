# Task: gen-heap-kth_largest-4230 | Score: 100% | 2026-02-15T07:49:23.858096

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()