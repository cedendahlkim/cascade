# Task: gen-heap-kth_largest-4812 | Score: 100% | 2026-02-14T12:04:30.457615

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()