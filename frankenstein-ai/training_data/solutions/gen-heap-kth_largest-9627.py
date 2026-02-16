# Task: gen-heap-kth_largest-9627 | Score: 100% | 2026-02-14T12:04:40.507316

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()