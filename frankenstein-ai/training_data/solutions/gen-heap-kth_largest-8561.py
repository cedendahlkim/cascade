# Task: gen-heap-kth_largest-8561 | Score: 100% | 2026-02-14T12:08:41.351190

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()