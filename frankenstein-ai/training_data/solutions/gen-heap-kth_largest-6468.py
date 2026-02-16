# Task: gen-heap-kth_largest-6468 | Score: 100% | 2026-02-14T12:59:34.790596

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()