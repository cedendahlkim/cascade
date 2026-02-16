# Task: gen-comb-subsets-6613 | Score: 100% | 2026-02-11T09:23:25.425853

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    def generate_subsets(nums):
        subsets = []
        for i in range(1 << len(nums)):
            subset = []
            for j in range(len(nums)):
                if (i >> j) & 1:
                    subset.append(nums[j])
            subsets.append(subset)
        return subsets

    subsets = generate_subsets(nums)
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(*subset)

solve()