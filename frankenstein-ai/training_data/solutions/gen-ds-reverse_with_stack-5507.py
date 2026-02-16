# Task: gen-ds-reverse_with_stack-5507 | Score: 100% | 2026-02-13T21:27:13.030469

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))