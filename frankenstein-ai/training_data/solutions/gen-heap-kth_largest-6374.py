# Task: gen-heap-kth_largest-6374 | Score: 100% | 2026-02-15T13:30:01.133820

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()