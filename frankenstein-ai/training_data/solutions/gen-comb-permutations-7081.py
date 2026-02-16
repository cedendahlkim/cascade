# Task: gen-comb-permutations-7081 | Score: 100% | 2026-02-11T08:56:21.104101

import itertools

def main():
  n = int(input())
  numbers = []
  for _ in range(n):
    numbers.append(input())

  permutations = list(itertools.permutations(numbers))

  for permutation in permutations:
    print(' '.join(permutation))

if __name__ == "__main__":
  main()