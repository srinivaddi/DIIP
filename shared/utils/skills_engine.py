import os
import re
import yaml
from typing import Dict, Any, Tuple
from shared.utils.llm import LLMClient

class SkillsEngine:
    """
    Parses and executes markdown-based skills inside .agents/skills/
    by parsing YAML frontmatter metadata and using the body content as LLM system instructions.
    """
    def __init__(self, skills_dir: str = "c:/Users/srvad/source/5DayAgenticEnggKaggle/Projects/capstone_project/DIIP/.agents/skills"):
        self.skills_dir = skills_dir
        self.llm_client = LLMClient()

    def load_skill(self, skill_folder_name: str) -> Tuple[Dict[str, Any], str]:
        """
        Reads a SKILL.md file, parses its frontmatter and body.
        """
        skill_path = os.path.join(self.skills_dir, skill_folder_name, "SKILL.md")
        if not os.path.exists(skill_path):
            raise FileNotFoundError(f"SKILL.md not found in {skill_path}")

        with open(skill_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Regex to split YAML frontmatter and Markdown body
        match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
        if not match:
            # Fallback if no frontmatter is found
            return {"name": skill_folder_name, "description": ""}, content

        frontmatter_text = match.group(1)
        markdown_body = match.group(2)

        metadata = yaml.safe_load(frontmatter_text)
        return metadata, markdown_body

    def execute_skill(self, skill_name: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Loads the skill instructions, formats the inputs, and queries the LLM.
        """
        metadata, instructions = self.load_skill(skill_name)
        
        # Prepare the user prompt string by dumping variables
        user_prompt = "Process the following inputs:\n"
        for key, val in inputs.items():
            user_prompt += f"\n### {key.upper()}\n{str(val)}\n"

        # Execute LLM call using skill instructions as system instructions
        result = self.llm_client.generate_json(
            system_instruction=instructions,
            prompt=user_prompt
        )
        return result

if __name__ == "__main__":
    engine = SkillsEngine()
    try:
        # Test loading one of the newly created skills
        meta, body = engine.load_skill("theme-extraction-skill")
        print(f"Loaded Skill: {meta['name']}")
        print(f"Description: {meta['description']}")
    except Exception as e:
        print(f"Test error: {str(e)}")
