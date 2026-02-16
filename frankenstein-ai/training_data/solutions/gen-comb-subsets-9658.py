# Task: gen-comb-subsets-9658 | Score: 100% | 2026-02-11T10:39:26.305379

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    def generate_subsets(arr):
        result = []
        for i in range(1 << len(arr)):
            subset = []
            for j in range(len(arr)):
                if (i >> j) & 1:
                    subset.append(arr[j])
            result.append(subset)
        return result

    subsets = generate_subsets(nums)
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(*subset)

solve()