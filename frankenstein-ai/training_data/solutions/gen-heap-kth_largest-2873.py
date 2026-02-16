# Task: gen-heap-kth_largest-2873 | Score: 100% | 2026-02-15T07:59:10.624517

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()