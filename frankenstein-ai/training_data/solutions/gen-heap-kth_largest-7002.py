# Task: gen-heap-kth_largest-7002 | Score: 100% | 2026-02-15T12:03:05.398243

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()