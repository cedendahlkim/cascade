# Task: gen-ds-reverse_with_stack-8594 | Score: 100% | 2026-02-13T18:51:13.808139

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))