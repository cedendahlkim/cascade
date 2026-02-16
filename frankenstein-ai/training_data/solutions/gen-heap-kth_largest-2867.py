# Task: gen-heap-kth_largest-2867 | Score: 100% | 2026-02-15T08:35:52.772027

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()