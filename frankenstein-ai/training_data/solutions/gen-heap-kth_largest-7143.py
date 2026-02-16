# Task: gen-heap-kth_largest-7143 | Score: 100% | 2026-02-15T08:14:07.710694

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()