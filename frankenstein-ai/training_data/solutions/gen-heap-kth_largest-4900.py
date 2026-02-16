# Task: gen-heap-kth_largest-4900 | Score: 100% | 2026-02-14T12:48:26.638782

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()