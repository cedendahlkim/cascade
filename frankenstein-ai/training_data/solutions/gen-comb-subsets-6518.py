# Task: gen-comb-subsets-6518 | Score: 100% | 2026-02-11T10:13:21.483130

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    def print_subset(subset):
        print(' '.join(subset))

    def generate_subsets(arr):
        result = []
        def backtrack(index, current_subset):
            if index == len(arr):
                result.append(current_subset[:])
                return

            backtrack(index + 1, current_subset)
            current_subset.append(arr[index])
            backtrack(index + 1, current_subset)
            current_subset.pop()

        backtrack(0, [])
        return result

    subsets = generate_subsets(nums)
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print_subset(subset)
solve()