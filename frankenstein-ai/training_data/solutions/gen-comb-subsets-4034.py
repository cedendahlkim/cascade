# Task: gen-comb-subsets-4034 | Score: 100% | 2026-02-11T10:38:50.538702

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    def print_subset(subset):
        print(*subset)

    def generate_subsets(nums):
        subsets = []
        for i in range(1 << len(nums)):
            subset = []
            for j in range(len(nums)):
                if (i >> j) & 1:
                    subset.append(nums[j])
            subsets.append(subset)

        subsets.sort(key=lambda x: (len(x), x)) 

        for subset in subsets:
            print_subset(subset)

    generate_subsets(nums)

solve()